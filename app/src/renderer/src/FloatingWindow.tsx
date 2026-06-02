import { useEffect, useRef, useState, type ReactNode } from 'react'

export type Rect = { x: number; y: number; w: number; h: number }

// A draggable, resizable floating window that lives on the canvas.
// Drag by the header, resize from the bottom-right corner, minimize to collapse.
// Kept mounted while minimized (display:none) so the terminal session survives.
export default function FloatingWindow({
  title,
  icon,
  initial,
  minWidth = 320,
  minHeight = 180,
  visible,
  z,
  onMinimize,
  onFocus,
  children
}: {
  title: string
  icon?: ReactNode
  initial: Rect
  minWidth?: number
  minHeight?: number
  visible: boolean
  z: number
  onMinimize: () => void
  onFocus?: () => void
  children: ReactNode
}): JSX.Element {
  const [rect, setRect] = useState<Rect>(initial)
  const drag = useRef<{ type: 'move' | 'resize'; sx: number; sy: number; r: Rect } | null>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent): void => {
      const d = drag.current
      if (!d) return
      const dx = e.clientX - d.sx
      const dy = e.clientY - d.sy
      if (d.type === 'move') {
        setRect({ ...d.r, x: Math.max(0, d.r.x + dx), y: Math.max(0, d.r.y + dy) })
      } else {
        setRect({ ...d.r, w: Math.max(minWidth, d.r.w + dx), h: Math.max(minHeight, d.r.h + dy) })
      }
    }
    const onUp = (): void => {
      if (drag.current) document.body.style.cursor = ''
      drag.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [minWidth, minHeight])

  const startMove = (e: React.MouseEvent): void => {
    onFocus?.()
    drag.current = { type: 'move', sx: e.clientX, sy: e.clientY, r: rect }
  }
  const startResize = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onFocus?.()
    drag.current = { type: 'resize', sx: e.clientX, sy: e.clientY, r: rect }
    document.body.style.cursor = 'nwse-resize'
  }

  return (
    <div
      className="fwin"
      onMouseDown={() => onFocus?.()}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, zIndex: z, display: visible ? 'flex' : 'none' }}
    >
      <div className="fwin-header" onMouseDown={startMove}>
        <span className="fwin-dot" />
        {icon && <span className="fwin-icon">{icon}</span>}
        <span className="fwin-title">{title}</span>
        <button className="fwin-min" title="Minimize (⌘J)"
          onMouseDown={(e) => e.stopPropagation()} onClick={onMinimize}>
          <svg viewBox="0 0 24 24" fill="none"><path d="M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </div>
      <div className="fwin-body">{children}</div>
      <div className="fwin-resize" onMouseDown={startResize}>
        <svg viewBox="0 0 16 16" fill="none"><path d="M13 7l-6 6M13 11l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </div>
    </div>
  )
}
