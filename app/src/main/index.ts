import { app, BrowserWindow, ipcMain, dialog, shell, nativeImage, nativeTheme, globalShortcut, clipboard } from 'electron'
import { join, basename } from 'path'
import { readdirSync, readFileSync, writeFileSync, mkdirSync, createWriteStream, type WriteStream } from 'fs'
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
const ptyLineBuf = new Map<string, string>()
const killing = new Set<string>() // ids we're killing on purpose (restart/close)
let projectDir: string = app.getPath('home')

// Strip ANSI / OSC escape sequences so terminal output reads cleanly in the log.
// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g
function tapPty(id: string, data: string): void {
  const combined = (ptyLineBuf.get(id) || '') + data
  const parts = combined.split('\n')
  ptyLineBuf.set(id, parts.pop() || '') // keep the trailing partial line
  for (const raw of parts) {
    const line = raw.replace(ANSI, '').replace(/\r/g, '').trimEnd()
    if (line) dlog('log', 'pty', line.length > 2000 ? line.slice(0, 2000) + '…' : line)
  }
}

/* ------------------------------------------------------------------ */
/* Debug stream — feeds the standalone debug-logger window.            */
/* Captures both app runtime events (main/renderer/pty) and the        */
/* dev/build stream (Vite HMR + errors, forwarded from the renderer).  */
/* ------------------------------------------------------------------ */

type DebugEntry = { t: number; level: string; source: string; msg: string }
const debugBuf: DebugEntry[] = []
const DEBUG_MAX = 5000
let debugWin: BrowserWindow | null = null

// ---- persistence: one JSONL file per session, in userData/logs ----
const logDir = join(app.getPath('userData'), 'logs')
const incidentDir = join(app.getPath('userData'), 'incidents')
let logStream: WriteStream | null = null
let sessionLogPath = ''
try {
  mkdirSync(logDir, { recursive: true })
  mkdirSync(incidentDir, { recursive: true })
  sessionLogPath = join(logDir, `session-${Date.now()}.jsonl`)
  logStream = createWriteStream(sessionLogPath, { flags: 'a' })
} catch { /* noop — stream stays null, in-memory buffer still works */ }

// ---- incidents: a detected breakage + its surrounding log context ----
type Incident = { id: string; t: number; trigger: DebugEntry; context: DebugEntry[] }
let activeIncident: Incident | null = null
let lastBreakT = 0

// What counts as "broken" for self-heal purposes.
function isBreakage(e: DebugEntry): boolean {
  return e.level === 'error'
}

function writeIncident(inc: Incident): void {
  try {
    writeFileSync(join(incidentDir, `${inc.id}.json`), JSON.stringify(inc, null, 2))
    writeFileSync(join(incidentDir, 'latest.json'), JSON.stringify(inc, null, 2))
  } catch { /* noop */ }
}

function emitIncident(inc: Incident): void {
  if (debugWin && !debugWin.isDestroyed()) {
    debugWin.webContents.send('debug:incident', {
      id: inc.id, level: inc.trigger.level, source: inc.trigger.source, msg: inc.trigger.msg
    })
  }
}

// Fold rapid-fire errors (e.g. a render crash spewing lines) into one incident.
function openIncident(trigger: DebugEntry): void {
  const now = trigger.t
  const context = debugBuf.slice(-25)
  if (activeIncident && now - lastBreakT < 8000) {
    activeIncident.context = context
    lastBreakT = now
    writeIncident(activeIncident)
    emitIncident(activeIncident)
    return
  }
  activeIncident = { id: `inc-${now}`, t: now, trigger, context }
  lastBreakT = now
  writeIncident(activeIncident)
  emitIncident(activeIncident)
}

function fmtArg(a: unknown): string {
  if (typeof a === 'string') return a
  if (a instanceof Error) return a.stack || a.message
  try { return JSON.stringify(a) } catch { return String(a) }
}

function dlog(level: string, source: string, msg: string): void {
  const entry: DebugEntry = { t: Date.now(), level, source, msg }
  debugBuf.push(entry)
  if (debugBuf.length > DEBUG_MAX) debugBuf.splice(0, debugBuf.length - DEBUG_MAX)
  try { logStream?.write(JSON.stringify(entry) + '\n') } catch { /* noop */ }
  if (debugWin && !debugWin.isDestroyed()) debugWin.webContents.send('debug:line', entry)
  if (isBreakage(entry)) openIncident(entry)
}

// Mirror main-process console output into the stream.
;(['log', 'info', 'warn', 'error'] as const).forEach((m) => {
  const orig = console[m].bind(console)
  console[m] = (...args: unknown[]): void => {
    orig(...args)
    dlog(m === 'log' ? 'log' : m, 'main', args.map(fmtArg).join(' '))
  }
})

process.on('uncaughtException', (err) => dlog('error', 'main', `uncaughtException: ${err.stack || err}`))
process.on('unhandledRejection', (reason) => dlog('error', 'main', `unhandledRejection: ${fmtArg(reason)}`))

function createDebugWindow(): void {
  if (debugWin && !debugWin.isDestroyed()) { debugWin.show(); debugWin.focus(); return }
  debugWin = new BrowserWindow({
    width: 580,
    height: 720,
    show: false,
    title: 'Dogfood — Debug',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 13, y: 16 },
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  debugWin.on('ready-to-show', () => debugWin?.show())
  debugWin.on('closed', () => { debugWin = null })
  if (process.env['ELECTRON_RENDERER_URL']) {
    debugWin.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/debug.html`)
  } else {
    debugWin.loadFile(join(__dirname, '../renderer/debug.html'))
  }
  dlog('system', 'system', 'debug window opened')
}

function toggleDebugWindow(): void {
  if (debugWin && !debugWin.isDestroyed()) debugWin.close()
  else createDebugWindow()
}

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

  win.on('ready-to-show', () => { win?.show(); dlog('system', 'system', 'main window ready') })

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
  createDebugWindow()
  // ⌥⌘D toggles the debug logger from anywhere.
  globalShortcut.register('Alt+Command+D', toggleDebugWindow)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => globalShortcut.unregisterAll())

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
  dlog('info', 'main', `project opened: ${projectDir}`)
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
  if (existing) { killing.add(id); try { existing.kill() } catch { /* noop */ } ptys.delete(id) }
  const shellPath = process.env.SHELL || '/bin/zsh'
  const proc = pty.spawn(shellPath, [], {
    name: 'xterm-256color',
    cols: cols || 80,
    rows: rows || 24,
    cwd: projectDir,
    env: { ...process.env, TERM: 'xterm-256color' } as { [key: string]: string }
  })
  proc.onData((d) => {
    win?.webContents.send('pty:data', { id, data: d })
    tapPty(id, d)
  })
  proc.onExit(({ exitCode }) => {
    win?.webContents.send('pty:exit', { id })
    ptys.delete(id)
    ptyLineBuf.delete(id)
    const intentional = killing.delete(id)
    // a kill we initiated isn't a failure — don't flag it as an error / incident
    dlog(intentional ? 'info' : exitCode ? 'error' : 'info', 'pty', `exit ${id} (code ${exitCode})${intentional ? ' — restart' : ''}`)
  })
  ptys.set(id, proc)
  dlog('info', 'pty', `start ${id} — ${shellPath} @ ${projectDir}`)
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
  if (proc) { killing.add(id); try { proc.kill() } catch { /* noop */ } ptys.delete(id) }
})

ipcMain.handle('shell:reveal', (_e, p: string) => {
  shell.showItemInFolder(p)
})

/* ------------------------------------------------------------------ */
/* Theme — drives macOS vibrancy tint (light frost vs dark frost)      */
/* ------------------------------------------------------------------ */

ipcMain.handle('theme:set', (_e, mode: 'light' | 'dark' | 'system') => {
  nativeTheme.themeSource = mode
  dlog('info', 'main', `theme → ${mode}`)
  // re-apply vibrancy so its tint re-evaluates against the new appearance
  if (win && process.platform === 'darwin') {
    win.setVibrancy(null)
    win.setVibrancy('under-window')
  }
  return nativeTheme.shouldUseDarkColors
})

ipcMain.handle('theme:get', () => nativeTheme.shouldUseDarkColors)

/* ------------------------------------------------------------------ */
/* Debug logger IPC                                                    */
/* ------------------------------------------------------------------ */

// Renderer-side events (console, window errors, Vite HMR) arrive here.
ipcMain.on('debug:emit', (_e, { level, source, msg }: { level?: string; source?: string; msg?: string }) => {
  dlog(level || 'log', source || 'renderer', String(msg ?? ''))
})

// Debug window finished loading — replay the buffered history into it.
ipcMain.on('debug:ready', (e) => {
  for (const entry of debugBuf) e.sender.send('debug:line', entry)
  if (activeIncident) emitIncident(activeIncident)
})

// Manual self-heal: write the incident report + copy a ready-to-paste prompt
// pointing Claude Code at it. (When the live in-app terminal lands, this will
// send the prompt straight into the running agent instead of the clipboard.)
ipcMain.handle('debug:heal', () => {
  if (!activeIncident) return null
  const path = join(incidentDir, `${activeIncident.id}.json`)
  const prompt =
    `The Dogfood app hit a runtime error.\n\n` +
    `Read the incident report at:\n${path}\n\n` +
    `It contains the failing event and the surrounding log context. ` +
    `Diagnose the root cause and fix it.`
  try { clipboard.writeText(prompt) } catch { /* noop */ }
  dlog('system', 'system', `heal requested for ${activeIncident.id} — prompt copied to clipboard`)
  return { id: activeIncident.id, path, prompt }
})

ipcMain.on('debug:dismiss-incident', () => {
  activeIncident = null
  if (debugWin && !debugWin.isDestroyed()) debugWin.webContents.send('debug:incident-cleared')
})

ipcMain.handle('debug:reveal-logs', () => {
  if (sessionLogPath) shell.showItemInFolder(sessionLogPath)
  return sessionLogPath
})

ipcMain.on('debug:clear', () => {
  debugBuf.length = 0
  if (debugWin && !debugWin.isDestroyed()) debugWin.webContents.send('debug:cleared')
})

ipcMain.on('debug:toggle', () => toggleDebugWindow())
