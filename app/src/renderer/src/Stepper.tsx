import { useState } from 'react'

// A vertical number stepper (from references/Reference v0). Self-contained so it
// drops straight onto the canvas. Up chevron is the live/accent state, down is
// idle — both work. The number animates in the direction you stepped (a little
// motion, since that's the house style now).

const GREEN = '#46c08c'
const GRAY = '#d0d0d0'

const css = `
.stp { display:flex; flex-direction:column; align-items:center; gap:30px; user-select:none;
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",sans-serif; }
.stp-btn { background:none; border:0; padding:10px 14px; line-height:0; cursor:pointer; color:${GRAY};
  transition: color .18s ease, transform .2s cubic-bezier(.34,1.56,.64,1); }
.stp-btn svg { display:block; }
.stp-up { color:${GREEN}; }
.stp-btn:hover { color:${GREEN}; }
.stp-up:hover { transform:translateY(-3px) scale(1.06); }
.stp-down:hover { transform:translateY(3px) scale(1.06); }
.stp-btn:active { transform:scale(.88); }
.stp-num { font-size:64px; font-weight:300; color:${GREEN}; line-height:1;
  font-variant-numeric:tabular-nums; letter-spacing:-.02em; min-width:1ch; text-align:center; }
.stp-num.up   { animation: stpUp .26s cubic-bezier(.16,1,.3,1); }
.stp-num.down { animation: stpDown .26s cubic-bezier(.16,1,.3,1); }
@keyframes stpUp   { from{ transform:translateY(12px); opacity:0 } to{ transform:translateY(0); opacity:1 } }
@keyframes stpDown { from{ transform:translateY(-12px); opacity:0 } to{ transform:translateY(0); opacity:1 } }
`

const Up = (
  <svg width="104" height="42" viewBox="0 0 104 42" fill="none">
    <path d="M6 36 52 6l46 30" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Down = (
  <svg width="104" height="42" viewBox="0 0 104 42" fill="none">
    <path d="M6 6 52 36 98 6" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function Stepper(): JSX.Element {
  const [value, setValue] = useState(14)
  const [dir, setDir] = useState<'up' | 'down' | ''>('')
  const bump = (d: 1 | -1): void => {
    setDir(d === 1 ? 'up' : 'down')
    setValue((v) => v + d)
  }
  return (
    <div className="stp">
      <style>{css}</style>
      <button className="stp-btn stp-up" aria-label="Increment" onClick={() => bump(1)}>{Up}</button>
      <span key={value} className={`stp-num ${dir}`}>{value}</span>
      <button className="stp-btn stp-down" aria-label="Decrement" onClick={() => bump(-1)}>{Down}</button>
    </div>
  )
}
