import { useEffect, useRef, useState } from 'react'
import { DialRoot, useDialKit } from 'dialkit'
import Terminal from './Terminal'

// Dogfood shell — gray window · breadcrumb titlebar · full-width stage with a
// resizable bottom dock (Dials = inline dialkit panel · Terminal = live pty).

export default function CursorClone(): JSX.Element {
  const [theme] = useState<'light' | 'dark'>('light')
  const [dockTab, setDockTab] = useState<'dials' | 'terminal'>('dials')

  // inline dialkit panel — parameters for the active node (placeholder set)
  useDialKit('Parameters', {
    gain: [0.8, 0, 2],
    pan: [0, -1, 1],
    mix: [50, 0, 100],
    bypass: false
  })

  // Drive the macOS window vibrancy tint from the UI theme (guard StrictMode double-invoke).
  const lastTheme = useRef<string | null>(null)
  useEffect(() => {
    if (lastTheme.current === theme) return
    lastTheme.current = theme
    window.dogfood?.theme?.set?.(theme)
  }, [theme])

  // resizable dock height (drag the top edge up to grow)
  const [dockH, setDockH] = useState(300)
  const startDockResize = (e: React.MouseEvent): void => {
    e.preventDefault()
    const sy = e.clientY
    const sh = dockH
    document.body.style.cursor = 'ns-resize'
    const onMove = (ev: MouseEvent): void => {
      setDockH(Math.min(Math.max(160, sh + (sy - ev.clientY)), window.innerHeight - 160))
    }
    const onUp = (): void => {
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div className={`cc cc-${theme}`}>
      {/* titlebar: breadcrumb (drag region; clears native traffic lights) */}
      <div className="cc-titlebar">
        <div className="cc-crumb">
          <span className="c-dim">New project</span>
          <span className="c-sep">/</span>
          <span className="c-cur">New</span>
        </div>
      </div>

      {/* main: full-width stage with the bottom dock */}
      <div className="cc-main">
        <div className="cc-stage">
          <div className="cc-dock" style={{ height: dockH }}>
            <div className="cc-dock-resize" onMouseDown={startDockResize} title="Drag to resize" />
            <div className="cc-dock-tabs">
              <span className={`dtab ${dockTab === 'dials' ? 'on' : ''}`} onClick={() => setDockTab('dials')}>Dials</span>
              <span className={`dtab ${dockTab === 'terminal' ? 'on' : ''}`} onClick={() => setDockTab('terminal')}>Terminal</span>
            </div>
            <div className="cc-dock-body">
              {/* both panes stay mounted so the live terminal session survives a tab switch */}
              <div className="dock-pane dials" style={{ display: dockTab === 'dials' ? 'block' : 'none' }}>
                <DialRoot mode="inline" theme={theme} />
              </div>
              <div className="dock-pane term" style={{ display: dockTab === 'terminal' ? 'block' : 'none' }}>
                <Terminal id="main" theme={theme} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
