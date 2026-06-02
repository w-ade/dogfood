import { useEffect, useRef, useState } from 'react'
import Terminal from './Terminal'

const X = (
  <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
)
const Plus = (
  <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
)

// The terminal panel — slides in from the right, resizable, with Cursor-style
// terminal tabs (each tab is its own live shell). + adds, × closes, click switches.
export default function DialPanel({
  open,
  theme
}: {
  open: boolean
  theme: 'light' | 'dark'
}): JSX.Element {
  const [w, setW] = useState(() => {
    const saved = Number(localStorage.getItem('dogfood-panelW'))
    return saved >= 300 ? saved : 420
  })
  const [resizing, setResizing] = useState(false)
  const dragging = useRef(false)

  const counter = useRef(1)
  const [terms, setTerms] = useState<string[]>(['t1'])
  const [activeTerm, setActiveTerm] = useState('t1')

  useEffect(() => {
    try { localStorage.setItem('dogfood-panelW', String(w)) } catch { /* noop */ }
  }, [w])

  const addTerm = (): void => {
    counter.current += 1
    const id = `t${counter.current}`
    setTerms((c) => [...c, id])
    setActiveTerm(id)
  }
  const closeTerm = (id: string): void => {
    setTerms((c) => {
      const next = c.filter((x) => x !== id)
      if (next.length) setActiveTerm((a) => (a === id ? next[next.length - 1] : a))
      return next
    })
  }

  const startResize = (e: React.MouseEvent): void => {
    e.preventDefault()
    dragging.current = true
    setResizing(true)
    const startX = e.clientX
    const startW = w
    document.body.style.cursor = 'ew-resize'
    const onMove = (ev: MouseEvent): void => {
      if (!dragging.current) return
      setW(Math.min(Math.max(300, startW + (startX - ev.clientX)), window.innerWidth - 220))
    }
    const onUp = (): void => {
      dragging.current = false
      setResizing(false)
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div className={`dialpanel ${open ? 'open' : ''} ${resizing ? 'resizing' : ''}`} style={{ width: w }}>
      <div className="dialpanel-resize" onMouseDown={startResize} title="Drag to resize" />

      <div className="termtabs">
        {terms.map((id, i) => (
          <div key={id} className={`ttab ${id === activeTerm ? 'on' : ''}`} onClick={() => setActiveTerm(id)}>
            <span className="ttab-name">zsh — {i + 1}</span>
            {terms.length > 1 && (
              <button className="ttab-x" title="Close" onClick={(e) => { e.stopPropagation(); closeTerm(id) }}>{X}</button>
            )}
          </div>
        ))}
        <button className="ttab-add" title="New terminal" onClick={addTerm}>{Plus}</button>
      </div>

      <div className="termbody">
        {terms.map((id) => (
          <div key={id} className="termpane" style={{ display: id === activeTerm ? 'block' : 'none' }}>
            <Terminal id={id} theme={theme} />
          </div>
        ))}
      </div>
    </div>
  )
}
