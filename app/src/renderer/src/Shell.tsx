// Dogfood shell — agent chat (left) + live browser preview (right).
// Visual recreation; transcript text is placeholder. Renders in a plain
// browser (no Electron-only imports) so it works in the :5176 design view.

/* ---------- tiny inline icons (Tabler-ish; swap to Central later) ---------- */
type I = { size?: number; className?: string }
const s = (size = 16, children: React.ReactNode, sw = 1.6, cls?: string): JSX.Element => (
  <svg className={cls} width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)
const Sidebar = ({ size, className }: I) => s(size, <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>, 1.6, className)
const Doc = ({ size, className }: I) => s(size, <><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /></>, 1.6, className)
const Term = ({ size, className }: I) => s(size, <><path d="M5 7l5 5-5 5" /><path d="M13 17h6" /></>, 1.6, className)
const Share = ({ size, className }: I) => s(size, <><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M12 3v13" /><path d="M8 7l4-4 4 4" /></>, 1.6, className)
const Play = ({ size, className }: I) => s(size, <path d="M7 5v14l12-7z" fill="currentColor" stroke="none" />, 1.6, className)
const Kebab = ({ size, className }: I) => s(size, <><circle cx="12" cy="5" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="19" r="1.4" fill="currentColor" /></>, 1.4, className)
const Chevron = ({ size, className }: I) => s(size, <path d="M9 6l6 6-6 6" />, 1.7, className)
const ChevDown = ({ size, className }: I) => s(size, <path d="M6 9l6 6 6-6" />, 1.7, className)
const Globe = ({ size, className }: I) => s(size, <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" /></>, 1.5, className)
const Back = ({ size, className }: I) => s(size, <path d="M15 6l-6 6 6 6" />, 1.7, className)
const Fwd = ({ size, className }: I) => s(size, <path d="M9 6l6 6-6 6" />, 1.7, className)
const Pencil = ({ size, className }: I) => s(size, <path d="M4 20h4l10-10a2 2 0 0 0-3-3L5 17v3z" />, 1.5, className)
const Cursor = ({ size, className }: I) => s(size, <path d="M5 3l15 8-7 2-3 7z" />, 1.5, className)
const Refresh = ({ size, className }: I) => s(size, <><path d="M20 11a8 8 0 1 0-1 5" /><path d="M20 4v5h-5" /></>, 1.6, className)
const Close = ({ size, className }: I) => s(size, <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>, 1.7, className)
const Check = ({ size, className }: I) => s(size, <path d="M5 12l5 5L20 7" />, 1.8, className)
const Folder = ({ size, className }: I) => s(size, <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />, 1.5, className)
const Plus = ({ size, className }: I) => s(size, <><path d="M12 5v14" /><path d="M5 12h14" /></>, 1.7, className)
const Mic = ({ size, className }: I) => s(size, <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></>, 1.6, className)
const Return = ({ size, className }: I) => s(size, <><path d="M9 10l-4 4 4 4" /><path d="M5 14h11a4 4 0 0 0 4-4V6" /></>, 1.6, className)
const Pause = ({ size, className }: I) => s(size, <><rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" /><rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" /></>, 1.4, className)
const Asterisk = ({ size, className }: I) => s(size, <><path d="M12 4v16" /><path d="M4 12h16" /><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>, 1.6, className)

/* ---------- data ---------- */
const TOOL_ROWS = [
  'Tested steeper exit-end easings',
  'Edited a file, ran a command',
  'Used 2 tools',
  'Saved a memory'
]
const COLORS: [string, string][] = [
  ['cyan', '9EDFE0'], ['lime', '9EE66F'], ['nearblk', '20221D'], ['pink', 'FED5EE'],
  ['peach', 'FEBE8F'], ['olive', '3A331C'], ['maroon', '320608'], ['forest', '153200'],
  ['yellow', 'FDE967'], ['purple', '260A2E']
]

export default function Shell(): JSX.Element {
  return (
    <div className="app">
      {/* ============ LEFT: agent ============ */}
      <section className="agent">
        <header className="abar">
          <span className="lights"><i className="l-r" /><i className="l-y" /><i className="l-g" /></span>
          <button className="ibtn"><Sidebar /></button>
          <div className="proj">
            <Doc size={15} />
            <span className="proj-name">Wise</span>
            <span className="proj-tag">lottie</span>
          </div>
          <div className="abar-actions">
            <button className="ibtn"><Term /></button>
            <button className="ibtn"><Share /></button>
            <button className="ibtn run"><Play size={15} /></button>
            <button className="ibtn"><Kebab /></button>
          </div>
        </header>

        <div className="transcript">
          <p>Yes, that's doable without breaking the continuous start — the trick
            is to steepen only the <b>end</b> of the exit curve, so the last part
            launches harder while the opening stays gentle.</p>

          {tool(TOOL_ROWS[0])}

          <p>The strongest late launch keeps the exit gentle through the middle,
            then accelerates hard at the very end — <code>f73=31 → f74=40</code> px/f
            (vs the current 35). Minimum velocity stays at <code>1.52</code>, so it
            reads as continuous, never a dwell.</p>

          {tool(TOOL_ROWS[1])}

          <p>The ramp now stays gentle through the middle then launches at the very
            end: <code>f69=17 → f74=39.5</code> px/f — the last stretch of the exit
            more than doubles in speed. Let me confirm it visually near the launch.</p>

          {tool(TOOL_ROWS[2])}

          <p>Frame 73 shows the lines launching off cleanly to the right,
            mid-acceleration — no break, still tightly aligned. The exit does exactly
            what you asked: gentle slow start, then a hard speed-up at the last part.</p>

          {tool(TOOL_ROWS[3])}

          <p>Done — and yes, it holds together without breaking. I steepened only the
            tail, leaving the slow continuous start intact:</p>

          <ul className="bullets">
            <li><b>Easing:</b> <code>EXI_0 = .41,.07</code> (slow start, no dwell) →
              <code>EXI_I = .93,.13</code> (hard launch at the very end).</li>
            <li><b>Result:</b> the exit stays gentle through the middle, then the last
              part speeds up sharply — final frames more than double in speed.</li>
            <li><b>Stable:</b> minimum velocity stays at the same floor, and the ramp
              is smooth and monotonic — confirmed clean at frame 73.</li>
          </ul>

          <p>That's about the practical ceiling for the late launch while keeping the
            lines on-screen through the cut. The only remaining lever is letting them
            clear a frame or two earlier — but as-is, nothing freezes or breaks.</p>

          <span className="done"><Asterisk size={16} /></span>
        </div>

        <footer className="composer">
          <div className="pr-row">
            <span className="pr-ctx"><b>lottie</b><span className="pr-branch">skill-updates</span></span>
            <span className="diff"><span className="add">+1,607</span> <span className="del">−130</span></span>
            <button className="pr-btn">Create PR <ChevDown size={13} /></button>
          </div>
          <div className="input">
            <span className="input-ph">Reply to the agent…</span>
            <button className="ibtn input-send"><Return size={15} /></button>
          </div>
          <div className="mbar">
            <span className="mbar-l">
              <span className="ask">Ask permissions</span>
              <button className="ibtn sm"><Plus size={14} /></button>
              <button className="ibtn sm"><Mic size={14} /></button>
              <button className="ibtn sm"><ChevDown size={13} /></button>
            </span>
            <span className="mbar-r">
              <span className="model">Opus 4.8 · Fast</span>
              <span className="effort">High</span>
              <span className="spinner" />
            </span>
          </div>
        </footer>
      </section>

      {/* ============ RIGHT: browser preview ============ */}
      <section className="preview">
        <div className="browser">
        <header className="bbar">
          <button className="ibtn"><Globe size={15} /></button>
          <button className="ibtn xs"><ChevDown size={12} /></button>
          <div className="url">localhost:3031/main-project/scene-1</div>
          <div className="bbar-actions">
            <button className="ibtn"><Back size={16} /></button>
            <button className="ibtn"><Fwd size={16} /></button>
            <button className="ibtn"><Pencil size={15} /></button>
            <button className="ibtn"><Cursor size={15} /></button>
            <button className="ibtn"><Refresh size={15} /></button>
            <button className="ibtn"><Kebab size={15} /></button>
            <button className="ibtn"><Close size={15} /></button>
          </div>
        </header>

        <div className="studio">
          {/* canvas left intentionally empty (imagery omitted) */}
          <div className="canvas" />

          {/* top-left: project panel */}
          <div className="panel projects">
            <div className="panel-head">
              <span className="studio-logo"><span className="logo-dot" />Diffusion Studio</span>
              <button className="ibtn xs"><Sidebar size={14} /></button>
            </div>
            <div className="panel-row sub"><span>Projects</span><button className="ibtn xs"><Plus size={13} /></button></div>
            <div className="panel-row on"><Folder size={15} /><span>Main Project</span><Check size={14} className="row-check" /></div>
            <div className="panel-row"><Folder size={15} /><span>Project 2</span></div>
          </div>

          {/* top-right: zoom + export */}
          <div className="studio-top">
            <span className="zoom">94% <ChevDown size={12} /></span>
            <button className="export">Export</button>
          </div>

          {/* right: properties */}
          <div className="panel properties">
            <div className="props-title">Properties</div>
            {COLORS.map(([name, hex]) => (
              <div className="prop" key={name}>
                <span className="prop-name">{name}</span>
                <span className="prop-val">
                  <span className="swatch" style={{ background: `#${hex}` }} />
                  <span className="hex">{hex}</span>
                </span>
              </div>
            ))}
          </div>

        </div>
        </div>

        <div className="transport">
          {/* bottom: scrubber */}
          <div className="scrubber">
            <button className="ibtn"><Pause size={15} /></button>
            <div className="track"><span className="playhead" /></div>
            <span className="frames">025 / 749</span>
            <span className="fps">30FPS</span>
          </div>

          {/* bottom: thumbnails */}
          <div className="thumbs">
            <div className="thumb on" />
            <div className="thumb" />
            <div className="thumb" />
            <button className="thumb add"><Plus size={16} /></button>
          </div>
        </div>
      </section>
    </div>
  )

  function tool(label: string): JSX.Element {
    return (
      <div className="tool">
        <span>{label}</span>
        <Chevron size={14} className="tool-chev" />
      </div>
    )
  }
}
