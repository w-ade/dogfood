import { app, BrowserWindow, ipcMain, dialog, shell, nativeImage, nativeTheme } from 'electron'
import { join, basename } from 'path'
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

// ---- window size/position memory ----
// Whatever size you drag the window to becomes the standard on next launch.
type WinState = { width: number; height: number; x?: number; y?: number }
const stateFile = join(app.getPath('userData'), 'window-state.json')
function loadWinState(): WinState | null {
  try { return JSON.parse(readFileSync(stateFile, 'utf8')) } catch { return null }
}
function saveWinState(w: BrowserWindow | null): void {
  try {
    if (!w || w.isDestroyed()) return
    writeFileSync(stateFile, JSON.stringify(w.getBounds()))
  } catch { /* noop */ }
}

// node-pty is a native module — load defensively so the app still runs if it
// hasn't been rebuilt for this Electron ABI yet.
let pty: typeof import('node-pty') | null = null
try {
  pty = require('node-pty')
} catch (err) {
  console.error('[dogfood] node-pty failed to load:', err)
}

let win: BrowserWindow | null = null
const ptys = new Map<string, import('node-pty').IPty>()
let projectDir: string = app.getPath('home')

function createWindow(): void {
  const saved = loadWinState()
  win = new BrowserWindow({
    width: saved?.width ?? 1240,
    height: saved?.height ?? 840,
    x: saved?.x,
    y: saved?.y,
    minWidth: 820,
    minHeight: 580,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 11 },
    backgroundColor: '#00000000',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  win.on('ready-to-show', () => win?.show())

  // remember size/position (debounced) and on close
  let t: ReturnType<typeof setTimeout>
  const persist = (): void => { clearTimeout(t); t = setTimeout(() => saveWinState(win), 400) }
  win.on('resize', persist)
  win.on('move', persist)
  win.on('close', () => saveWinState(win))

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Cowboy in the dock (dev)
  if (process.platform === 'darwin') {
    try {
      const icon = nativeImage.createFromPath(join(__dirname, '../../build/icon.png'))
      if (!icon.isEmpty()) app.dock?.setIcon(icon)
    } catch { /* noop */ }
  }
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

/* ------------------------------------------------------------------ */
/* Project                                                             */
/* ------------------------------------------------------------------ */

ipcMain.handle('dialog:openProject', async () => {
  if (!win) return null
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
  if (r.canceled || !r.filePaths[0]) return null
  projectDir = r.filePaths[0]
  return { path: projectDir, name: basename(projectDir) }
})

ipcMain.handle('project:current', () => {
  return { path: projectDir, name: basename(projectDir) }
})

/* ------------------------------------------------------------------ */
/* Component file listing (for the ⌘P palette)                         */
/* ------------------------------------------------------------------ */

const SKIP = new Set([
  'node_modules', '.git', 'dist', '.next', 'out', 'build',
  '.dogfood', 'coverage', '.turbo', '.cache'
])

ipcMain.handle('fs:listComponents', async () => {
  const root = projectDir
  const out: string[] = []
  const walk = (dir: string, depth: number): void => {
    if (depth > 8 || out.length > 4000) return
    let entries: ReturnType<typeof readdirSync>
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const ent of entries) {
      if (ent.name.startsWith('.')) continue
      if (SKIP.has(ent.name)) continue
      const full = join(dir, ent.name)
      if (ent.isDirectory()) walk(full, depth + 1)
      else if (/\.(tsx|jsx)$/.test(ent.name)) out.push(full.slice(root.length + 1))
    }
  }
  walk(root, 0)
  return out.sort()
})

/* ------------------------------------------------------------------ */
/* Activity — backed by git log of the project                         */
/* ------------------------------------------------------------------ */

ipcMain.handle('activity:list', async () => {
  try {
    const raw = execSync('git log -40 --pretty=format:%h%x1f%s%x1f%cr', {
      cwd: projectDir,
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString()
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line, i) => {
        const [hash, subject, when] = line.split('\x1f')
        return { hash, subject, when, current: i === 0 }
      })
  } catch {
    return []
  }
})

/* ------------------------------------------------------------------ */
/* Real terminal (node-pty)                                            */
/* ------------------------------------------------------------------ */

ipcMain.handle('pty:start', (e, { id, cols, rows }: { id: string; cols?: number; rows?: number }) => {
  if (!pty) {
    e.sender.send('pty:data', { id, data: '\r\n\x1b[33m[dogfood] terminal backend unavailable — run `npm run rebuild`\x1b[0m\r\n' })
    return false
  }
  const existing = ptys.get(id)
  if (existing) { try { existing.kill() } catch { /* noop */ } ptys.delete(id) }
  const shellPath = process.env.SHELL || '/bin/zsh'
  const proc = pty.spawn(shellPath, [], {
    name: 'xterm-256color',
    cols: cols || 80,
    rows: rows || 24,
    cwd: projectDir,
    env: { ...process.env, TERM: 'xterm-256color' } as { [key: string]: string }
  })
  proc.onData((d) => win?.webContents.send('pty:data', { id, data: d }))
  proc.onExit(() => {
    win?.webContents.send('pty:exit', { id })
    ptys.delete(id)
  })
  ptys.set(id, proc)
  return true
})

ipcMain.on('pty:write', (_e, { id, data }: { id: string; data: string }) => {
  ptys.get(id)?.write(data)
})

ipcMain.on('pty:resize', (_e, { id, cols, rows }: { id: string; cols: number; rows: number }) => {
  try { ptys.get(id)?.resize(cols, rows) } catch { /* noop */ }
})

ipcMain.on('pty:kill', (_e, { id }: { id: string }) => {
  const proc = ptys.get(id)
  if (proc) { try { proc.kill() } catch { /* noop */ } ptys.delete(id) }
})

ipcMain.handle('shell:reveal', (_e, p: string) => {
  shell.showItemInFolder(p)
})

/* ------------------------------------------------------------------ */
/* Theme — drives macOS vibrancy tint (light frost vs dark frost)      */
/* ------------------------------------------------------------------ */

ipcMain.handle('theme:set', (_e, mode: 'light' | 'dark' | 'system') => {
  nativeTheme.themeSource = mode
  // re-apply vibrancy so its tint re-evaluates against the new appearance
  if (win && process.platform === 'darwin') {
    win.setVibrancy(null)
    win.setVibrancy('under-window')
  }
  return nativeTheme.shouldUseDarkColors
})

ipcMain.handle('theme:get', () => nativeTheme.shouldUseDarkColors)
