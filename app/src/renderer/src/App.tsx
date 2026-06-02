import { useCallback, useEffect, useRef, useState } from 'react'
import DialPanel from './DialPanel'
import cowboy from './assets/cowboy.svg'
import cowboyInverse from './assets/cowboy-inverse.svg'

type Project = { path: string; name: string }
type Activity = { hash: string; subject: string; when: string; current: boolean }

// ---- tiny inline icon set (thin-stroke, rounded) ----
const I = {
  dog: <svg viewBox="0 0 24 24" fill="none"><path d="M5 8c0-1 1-2 3-2s3 1 3 2M13 8c0-1 1-2 3-2s3 1 3 2M4 12h16c0 4-3 7-8 7s-8-3-8-7Z" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>,
  folder: <svg viewBox="0 0 24 24" fill="none"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  activity: <svg viewBox="0 0 24 24" fill="none"><path d="M3 12h4l2 6 4-14 2 8h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  terminal: <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 9l3 3-3 3M13 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  panel: <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="2"/><path d="M3 14.5h18" stroke="currentColor" strokeWidth="2"/></svg>,
  chevDown: <svg viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevLeft: <svg viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  sun: <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  moon: <svg viewBox="0 0 24 24" fill="none"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  file: <svg viewBox="0 0 24 24" fill="none"><path d="M6 3h7l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M13 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  commit: <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/><path d="M2 12h6M16 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  close: <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
}

const base = (p: string): string => p.split('/').pop() || p

export default function App(): JSX.Element {
  const [project, setProject] = useState<Project | null>(null)
  const [focus, setFocus] = useState<string | null>(null)
  const [components, setComponents] = useState<string[]>([])
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [activity, setActivity] = useState<Activity[]>([])
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [bg, setBg] = useState<'grid' | 'plain' | 'dark'>('grid')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [zoom, setZoom] = useState(100)
  const [drawerH, setDrawerH] = useState(300)
  const [isResizing, setIsResizing] = useState(false)
  const resizing = useRef(false)
  const termEverOpened = useRef(false)
  if (terminalOpen) termEverOpened.current = true

  // drag the top edge of the shelf to resize it
  const startResize = (e: React.MouseEvent): void => {
    e.preventDefault()
    resizing.current = true
    setIsResizing(true)
    const startY = e.clientY
    const startH = drawerH
    document.body.style.cursor = 'ns-resize'
    const onMove = (ev: MouseEvent): void => {
      if (!resizing.current) return
      setDrawerH(Math.min(Math.max(140, startH + (startY - ev.clientY)), window.innerHeight - 150))
    }
    const onUp = (): void => {
      resizing.current = false
      setIsResizing(false)
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  useEffect(() => {
    window.dogfood.currentProject().then(setProject)
  }, [])

  // theme — persisted, follows system on first run; drives macOS vibrancy tint
  const applyTheme = useCallback((m: 'light' | 'dark') => {
    setTheme(m)
    document.documentElement.dataset.theme = m
    window.dogfood.theme?.set?.(m)
  }, [])
  useEffect(() => {
    const saved = localStorage.getItem('dogfood-theme') as 'light' | 'dark' | null
    if (saved) { applyTheme(saved); return }
    const g = window.dogfood.theme?.get?.()
    if (g) g.then((dark) => applyTheme(dark ? 'dark' : 'light'))
    else applyTheme('light')
  }, [applyTheme])
  const toggleTheme = (): void => {
    const next = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('dogfood-theme', next)
    applyTheme(next)
  }

  const refreshActivity = useCallback(() => {
    window.dogfood.activity().then(setActivity)
  }, [])

  const openProject = useCallback(async () => {
    const p = await window.dogfood.openProject()
    if (!p) return
    setProject(p)
    setFocus(null)
    setComponents([])
    refreshActivity()
  }, [refreshActivity])

  const openPalette = useCallback(async () => {
    setPaletteOpen(true)
    if (!components.length) setComponents(await window.dogfood.listComponents())
  }, [components.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key === 'o') { e.preventDefault(); openProject() }
      else if (meta && e.key === 'p') { e.preventDefault(); paletteOpen ? setPaletteOpen(false) : openPalette() }
      else if (meta && e.key === 'j') { e.preventDefault(); setTerminalOpen((v) => !v) }
      else if (meta && e.key === 'e') { e.preventDefault(); setActivityOpen((v) => { const n = !v; if (n) refreshActivity(); return n }) }
      else if (e.key === 'Escape') setPaletteOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openProject, openPalette, paletteOpen, refreshActivity])

  return (
    <div className="app">
      {/* ---------- top bar ---------- */}
      <div className="topbar">
        <div className="brand"><img className="mark" src={theme === 'dark' ? cowboyInverse : cowboy} alt="Cowboy" />dogfood</div>

        <button className={`focus ${focus ? '' : 'empty'}`} onClick={openPalette}>
          {focus ? base(focus) : 'Pick a component'}
          <span className="kbd">⌘P</span>
        </button>

        <div className="actions">
          <button className="iconbtn" title="Open project (⌘O)" onClick={openProject}>{I.folder}</button>
          <button className="iconbtn" title="Find component (⌘P)" onClick={openPalette}>{I.search}</button>
          <button className={`iconbtn ${activityOpen ? 'on' : ''}`} title="Activity (⌘E)"
            onClick={() => setActivityOpen((v) => { const n = !v; if (n) refreshActivity(); return n })}>{I.activity}</button>
          <button className={`iconbtn ${terminalOpen ? 'on' : ''}`} title="Terminal (⌘J)"
            onClick={() => setTerminalOpen((v) => !v)}>{I.panel}</button>
          <button className="iconbtn" title="Toggle light / dark" onClick={toggleTheme}>{theme === 'dark' ? I.sun : I.moon}</button>
        </div>
      </div>

      {/* ---------- body ---------- */}
      <div className="body">
        <div className={`canvas bg-${bg}`}>
          {focus && (
            <div className="artboard" style={{ transform: `scale(${zoom / 100})` }}>
              <div className="empty">
                <div className="big">{I.file}</div>
                <h2>{base(focus)}</h2>
                <p>{focus}</p>
                <p style={{ marginTop: 10, color: 'var(--gray2)' }}>Live render wires up next — open the terminal and type <b>claude</b> to start building it.</p>
              </div>
            </div>
          )}

          {/* floating controls */}
          <button className="statuspill" onClick={() => setTerminalOpen((v) => !v)}>
            <span className={`dot ${terminalOpen ? 'run' : ''}`} />
            {terminalOpen ? 'Terminal' : 'claude'}
            <span className="sub">· {project ? project.name : 'no project'}</span>
          </button>

          <div className="zoom">
            <button onClick={() => setZoom((z) => Math.max(25, z - 10))}>−</button>
            <span>{zoom}%</span>
            <button onClick={() => setZoom((z) => Math.min(200, z + 10))}>+</button>
          </div>
        </div>

        {/* ---------- activity panel (closeable) ---------- */}
        {activityOpen && (
          <div className="activity">
            <div className="ahead">
              <h3>Activity</h3>
              <button className="iconbtn" onClick={() => setActivityOpen(false)}>{I.close}</button>
            </div>
            <div className="alist">
              {activity.length === 0 ? (
                <div className="aempty">No activity yet.<br />History of changes to this project will appear here.</div>
              ) : activity.map((a) => (
                <div className="arow" key={a.hash + a.when}>
                  <span className="hash">{I.commit}{a.hash}</span>
                  <span className="subj">
                    {a.current && <span className="cur">→ Current</span>}
                    {a.subject}
                  </span>
                  <span className="stat">
                    <span className={`sd ${a.current ? 'current' : 'past'}`} />
                    {a.current ? 'Running' : 'Stopped'}
                    <span className="when">{a.when}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---------- dialkit panel — terminal + dials ---------- */}
      {termEverOpened.current && (
        <DialPanel open={terminalOpen} projectKey={project?.path || 'home'} theme={theme} />
      )}

      {/* ---------- command palette ---------- */}
      {paletteOpen && (
        <CommandPalette
          components={components}
          onPick={(f) => { setFocus(f); setPaletteOpen(false) }}
          onClose={() => setPaletteOpen(false)}
        />
      )}
    </div>
  )
}

function CommandPalette({
  components, onPick, onClose
}: {
  components: string[]
  onPick: (f: string) => void
  onClose: () => void
}): JSX.Element {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const filtered = components
    .filter((c) => c.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 200)

  useEffect(() => { setSel(0) }, [q])

  const onKey = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(filtered.length - 1, s + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[sel]) onPick(filtered[sel]) }
  }

  return (
    <div className="palette-scrim" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <div className="pinput">
          {I.search}
          <input ref={inputRef} value={q} placeholder="Find a component to focus…"
            onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} />
        </div>
        <div className="plist">
          {filtered.length === 0 ? (
            <div className="pempty">{components.length ? 'No matches.' : 'No .tsx / .jsx components found in this project.'}</div>
          ) : filtered.map((c, i) => (
            <div key={c} className={`pitem ${i === sel ? 'sel' : ''}`}
              onMouseEnter={() => setSel(i)} onClick={() => onPick(c)}>
              <span className="fic">{I.file}</span>
              <span className="nm">{base(c)}</span>
              <span className="pth">{c}</span>
            </div>
          ))}
        </div>
        <div className="pfoot"><span><b>↑↓</b> navigate</span><span><b>↵</b> focus</span><span><b>esc</b> close</span></div>
      </div>
    </div>
  )
}
