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
const ActivityLog = <svg viewBox="0 0 24 24" fill="none"><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3 8.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 4.5v4h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 8v4.2l2.8 1.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
const Sun = <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
const Moon = <svg viewBox="0 0 24 24" fill="none"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
const Bolt = <svg viewBox="0 0 24 24" fill="none"><path d="M3 12 7.5 4.2H16.5L21 12l-4.5 7.8H7.5L3 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.7"/></svg>

const shortcuts: [string, string[]][] = [
  ['Hide Terminal', ['⌘', 'J']],
  ['Search Files', ['⌘', 'P']],
  ['Open Browser', ['⇧', '⌘', 'B']]
]

const tabs = ['Terminal', 'Layers']

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

  const [panelW, setPanelW] = useState(420)
  const [collapsed, setCollapsed] = useState(false)
  const resizing = useRef(false)
  const startResize = (e: React.MouseEvent): void => {
    e.preventDefault()
    resizing.current = true
    const sx = e.clientX
    const sw = panelW
    document.body.style.cursor = 'ew-resize'
    const onMove = (ev: MouseEvent): void => {
      if (!resizing.current) return
      setPanelW(Math.min(Math.max(280, sw + (sx - ev.clientX)), window.innerWidth - 300))
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
          <button className={`cc-ic cc-toggle ${collapsed ? '' : 'on'}`} title="Terminal panel" onClick={() => setCollapsed((c) => !c)}>{PanelRight}</button>
          <button className="cc-ic cc-gear" title="Toggle light / dark" onClick={toggle}>{theme === 'dark' ? Sun : Moon}</button>
          <span className="cc-ic" title="Settings">{Bolt}</span>
        </div>
      </div>

      {/* body: canvas + right terminal panel */}
      <div className="cc-main">
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

        {!collapsed && (
          <div className="cc-panel" style={{ width: panelW }}>
            <div className="cc-panel-resize" onMouseDown={startResize} />
            <div className="cc-panel-head">
              <div className="cc-tabs">
                {tabs.map((t) => (
                  <span key={t} className={`cc-tab ${t === 'Terminal' ? 'on' : ''}`}>{t}</span>
                ))}
              </div>
              <div className="cc-panel-ctrls">
                <button className="cc-ic cc-toggle" title="Hide terminal" onClick={() => setCollapsed(true)}>{ChevDown}</button>
              </div>
            </div>
            <div className="cc-term">
              <div className="cc-term-line">
                <span className="cc-dot" />
                <span><span className="cc-prompt">$</span> npx tsc --noEmit 2&gt;&amp;1</span>
              </div>
              <div className="cc-cursor" />
            </div>
          </div>
        )}
      </div>

      {/* status bar */}
      <div className="cc-status">
        <div className="cc-status-right">
          {sc(ActivityLog)}
        </div>
      </div>
    </div>
  )
}
