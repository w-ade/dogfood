import { useRef, useState } from 'react'
import cowboyDark from './assets/cowboy.svg'
import cowboyLight from './assets/cowboy-inverse.svg'

// Static recreation of the Cursor / VS Code window (refs in references/),
// with Cowboy in place of the cube logo. Theme toggles via the gear. Visual only.

const sc = (icon: JSX.Element): JSX.Element => <span className="cc-ic">{icon}</span>

const PanelBottom = <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7"/><path d="M3 14h18" stroke="currentColor" strokeWidth="1.7"/><rect x="3.5" y="14.5" width="17" height="5" rx="1" fill="currentColor" opacity=".22"/></svg>
const PanelRight = <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7"/><path d="M15 4v16" stroke="currentColor" strokeWidth="1.7"/></svg>
const Gear = <svg viewBox="0 0 24 24" fill="none"><path d="M19.4 13a7.8 7.8 0 0 0 0-2l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a7.6 7.6 0 0 0-1.7 1l-2.3-1-2 3.4L4.6 11a7.8 7.8 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7.6 7.6 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5"/></svg>
const Plus = <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
const ChevDown = <svg viewBox="0 0 24 24" fill="none"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
const Split = <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M12 4v16" stroke="currentColor" strokeWidth="1.7"/></svg>
const Trash = <svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
const More = <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
const ChevUp = <svg viewBox="0 0 24 24" fill="none"><path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
const Close = <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
const Bell = <svg viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
const Sun = <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
const Moon = <svg viewBox="0 0 24 24" fill="none"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>

const shortcuts: [string, string[]][] = [
  ['New Agent', ['⇧', '⌘', 'L']],
  ['Hide Terminal', ['⌘', 'J']],
  ['Search Files', ['⌘', 'P']],
  ['Open Browser', ['⇧', '⌘', 'B']],
  ['Maximize Chat', ['⌥', '⌘', 'E']]
]

const tabs = ['Terminal', 'Activity', 'Layers']

export default function CursorClone(): JSX.Element {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('dogfood-theme') as 'light' | 'dark') || 'dark'
  )
  const toggle = (): void =>
    setTheme((t) => {
      const n = t === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem('dogfood-theme', n) } catch { /* noop */ }
      return n
    })

  const [panelH, setPanelH] = useState(280)
  const resizing = useRef(false)
  const startResize = (e: React.MouseEvent): void => {
    e.preventDefault()
    resizing.current = true
    const sy = e.clientY
    const sh = panelH
    document.body.style.cursor = 'ns-resize'
    const onMove = (ev: MouseEvent): void => {
      if (!resizing.current) return
      setPanelH(Math.min(Math.max(120, sh + (sy - ev.clientY)), window.innerHeight - 160))
    }
    const onUp = (): void => {
      resizing.current = false
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div className={`cc cc-${theme}`}>
      {/* title bar */}
      <div className="cc-titlebar">
        <div className="cc-title">Dogfood</div>
        <div className="cc-titleright">
          {sc(PanelBottom)}
          {sc(PanelRight)}
          <button className="cc-ic cc-gear" title="Toggle light / dark" onClick={toggle}>{theme === 'dark' ? Sun : Moon}</button>
        </div>
      </div>

      {/* editor / welcome */}
      <div className="cc-editor">
        <div className="cc-welcome">
          <img className="cc-logo" src={theme === 'dark' ? cowboyLight : cowboyDark} alt="" />
          <div className="cc-shortcuts">
            {shortcuts.map(([label, keys]) => (
              <div className="cc-sc" key={label}>
                <span className="cc-sc-label">{label}</span>
                <span className="cc-sc-keys">
                  {keys.map((k, i) => <span className="cc-key" key={i}>{k}</span>)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* bottom panel */}
      <div className="cc-panel" style={{ height: panelH }}>
        <div className="cc-panel-resize" onMouseDown={startResize} />
        <div className="cc-panel-head">
          <div className="cc-tabs">
            {tabs.map((t) => (
              <span key={t} className={`cc-tab ${t === 'Terminal' ? 'on' : ''}`}>{t}</span>
            ))}
          </div>
          <div className="cc-panel-ctrls">
            <span className="cc-agent"><span className="cc-inf">∞</span> Agent Terminal</span>
            <span className="cc-plus">{sc(Plus)}<span className="cc-cd">{ChevDown}</span></span>
            {sc(Split)}
            {sc(Trash)}
            {sc(More)}
            {sc(ChevUp)}
            {sc(Close)}
          </div>
        </div>

        <div className="cc-term">
          <div className="cc-term-line">
            <span className="cc-dot" />
            <span><span className="cc-prompt">$</span> npx tsc --noEmit 2&gt;&amp;1</span>
          </div>
          <div className="cc-cursor" />
        </div>

        <div className="cc-readonly">Agent terminals are read-only</div>
      </div>

      {/* status bar */}
      <div className="cc-status">
        <div className="cc-status-right">
          <span>Cursor Tab</span>
          {sc(Bell)}
        </div>
      </div>
    </div>
  )
}
