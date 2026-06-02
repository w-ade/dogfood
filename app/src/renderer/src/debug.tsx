// bugbot — the standalone debug console. Streams the app's runtime events
// (main + renderer + pty lifecycle) and the dev/build stream (Vite HMR + errors).
// Monochrome Geist-Mono log aesthetic (see references/termsnap). Vanilla DOM —
// no React — so the window stays light and instant.
import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-mono/600.css'
import './debug.css'

type Level = 'log' | 'info' | 'warn' | 'error'
type Entry = { t: number; level: Level; source: string; msg: string }

const entries: Entry[] = []
let autoscroll = true

const root = document.getElementById('dbg') as HTMLElement
root.innerHTML = `
  <header class="bb-bar">
    <div class="bb-drag"></div>
    <span class="bb-title">bugbot</span>
  </header>

  <div class="bb-head">
    <div class="bb-cmd"><span class="bb-tri">▲</span> bugbot logs --live</div>
    <div class="bb-ver">bugbot 0.1.0</div>
    <div class="bb-cols">
      <span class="bb-gut"></span>
      <span>Time</span>
      <span>Source</span>
      <span>Level</span>
      <span></span>
    </div>
  </div>

  <div class="bb-log" id="log"></div>

  <footer class="bb-foot">
    <span class="bb-foot-left">
      <span id="count">Tailing 0 events from dogfood</span>
      <span class="bb-inc" id="incident" hidden>
        <span class="bb-tri bb-inc-tri">▲</span>
        <span class="bb-inc-title">Incident detected</span>
        <span class="bb-inc-msg" id="inc-msg"></span>
      </span>
    </span>
    <span class="bb-spacer"></span>
    <button class="bb-heal" id="heal" hidden>Heal</button>
    <button class="bb-inc-x" id="inc-x" title="Dismiss" hidden>&times;</button>
    <span class="bb-foot-right" id="foot-right">
      <button class="bb-link" id="reveal">reveal logs</button>
      <span class="bb-foot-sep">·</span>
      <span class="bb-foot-live"><span class="bb-dot" id="livedot"></span><span id="livetxt">live</span></span>
    </span>
  </footer>
`

const logEl = document.getElementById('log') as HTMLElement
const countEl = document.getElementById('count') as HTMLElement
const incidentEl = document.getElementById('incident') as HTMLElement
const incMsgEl = document.getElementById('inc-msg') as HTMLElement
const healBtn = document.getElementById('heal') as HTMLButtonElement
const incXBtn = document.getElementById('inc-x') as HTMLButtonElement
const revealBtn = document.getElementById('reveal') as HTMLButtonElement
const footRight = document.getElementById('foot-right') as HTMLElement

// Incident lives in the footer: when active, the count/live cluster steps aside
// for the alert + Heal control.
function setIncident(active: boolean): void {
  incidentEl.hidden = !active
  countEl.hidden = active
  healBtn.hidden = !active
  incXBtn.hidden = !active
  footRight.hidden = active
}

function fmtTime(t: number): string {
  const d = new Date(t)
  const p = (n: number, w = 2): string => String(n).padStart(w, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`
}

function rowFor(e: Entry): HTMLElement {
  const row = document.createElement('div')
  row.className = `bb-row lvl-${e.level}`
  const mark = e.level === 'error' || e.level === 'warn' ? '▲' : ''
  row.innerHTML = `
    <span class="bb-gut">${mark}</span>
    <span class="bb-time">${fmtTime(e.t)}</span>
    <span class="bb-src">${e.source}</span>
    <span class="bb-lvl">${e.level}</span>
    <span class="bb-msg"></span>
  `
  ;(row.querySelector('.bb-msg') as HTMLElement).textContent = e.msg
  return row
}

function nearBottom(): boolean {
  return logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 40
}

function refreshCount(): void {
  countEl.textContent = `Tailing ${entries.length} event${entries.length === 1 ? '' : 's'} from dogfood`
}

function ingest(e: Entry): void {
  entries.push(e)
  if (entries.length > 5000) {
    entries.splice(0, entries.length - 5000)
    logEl.firstChild && logEl.removeChild(logEl.firstChild)
  }
  const stick = autoscroll && nearBottom()
  logEl.appendChild(rowFor(e))
  if (stick) logEl.scrollTop = logEl.scrollHeight
  refreshCount()
}

function renderAll(): void {
  logEl.replaceChildren()
  for (const e of entries) logEl.appendChild(rowFor(e))
  if (autoscroll) logEl.scrollTop = logEl.scrollHeight
}

// keep autoscroll glued unless the user scrolls up to read history
logEl.addEventListener('scroll', () => {
  autoscroll = nearBottom()
})

// ---- incidents / self-heal ----
revealBtn.addEventListener('click', () => window.dogfood.debug?.revealLogs?.())
incXBtn.addEventListener('click', () => {
  window.dogfood.debug?.dismissIncident?.()
  setIncident(false)
})
healBtn.addEventListener('click', async () => {
  healBtn.disabled = true
  const r = await window.dogfood.debug?.heal?.()
  if (r) {
    healBtn.textContent = 'copied ✓'
    setTimeout(() => {
      healBtn.textContent = 'Heal'
      healBtn.disabled = false
    }, 1800)
  } else {
    healBtn.disabled = false
  }
})

// ---- wire to main ----
window.dogfood.debug?.onLine?.((e: Entry) => ingest(e))
window.dogfood.debug?.onCleared?.(() => {
  entries.length = 0
  renderAll()
  refreshCount()
})
window.dogfood.debug?.onIncident?.((i) => {
  incMsgEl.textContent = `[${i.source}] ${i.msg}`
  healBtn.textContent = 'Heal'
  healBtn.disabled = false
  setIncident(true)
})
window.dogfood.debug?.onIncidentCleared?.(() => {
  setIncident(false)
})
window.dogfood.debug?.ready?.()
