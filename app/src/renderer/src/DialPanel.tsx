import { useEffect, useRef, useState } from 'react'
import { Folder } from 'dialkit'
import Terminal from './Terminal'

// The terminal lives inside a DialKit panel that slides in from the right.
// Drag its left edge to make it wider / narrower (width persists).
export default function DialPanel({
  open,
  projectKey,
  theme
}: {
  open: boolean
  projectKey: string
  theme: 'light' | 'dark'
}): JSX.Element {
  const [w, setW] = useState(() => {
    const saved = Number(localStorage.getItem('dogfood-panelW'))
    return saved >= 300 ? saved : 380
  })
  const [resizing, setResizing] = useState(false)
  const dragging = useRef(false)

  useEffect(() => {
    try { localStorage.setItem('dogfood-panelW', String(w)) } catch { /* noop */ }
  }, [w])

  const startResize = (e: React.MouseEvent): void => {
    e.preventDefault()
    dragging.current = true
    setResizing(true)
    const startX = e.clientX
    const startW = w
    document.body.style.cursor = 'ew-resize'
    const onMove = (ev: MouseEvent): void => {
      if (!dragging.current) return
      // drag left edge: moving left widens, moving right narrows
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
      <Folder title="" defaultOpen>
        <div className="dialpanel-term">
          <Terminal projectKey={projectKey} theme={theme} />
        </div>
      </Folder>
    </div>
  )
}
