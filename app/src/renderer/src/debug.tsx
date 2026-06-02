// Dogfood debug console — a standalone window that streams both the app's
// runtime events (main + renderer + pty lifecycle) and the dev/build stream
// (Vite HMR + errors). Clean docs aesthetic: SF Pro chrome, Geist Mono rows.
// Vanilla DOM — no React — so the window stays light and instant.
import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-mono/600.css'
import './debug.css'

type Level = 'log' | 'info' | 'warn' | 'error'
type Entry = { t: number; level: Level; source: string; msg: string }

const SOURCES = ['all', 'main', 'renderer', 'pty', 'build', 'system'] as const

const entries: Entry[] = []
let srcFilter = 'all'
let query = ''
let paused = false
let autoscroll = true

const root = document.getElementById('dbg') as HTMLElement
root.innerHTML = `
  <header class="dbg-bar">
    <div class="dbg-drag"></div>
    <span class="dbg-name">Debug</span>
    <span class="dbg-dot" id="livedot"></span>
    <span class="dbg-live" id="livetxt">live</span>
    <div class="dbg-tools">
      <div class="dbg-select">
        <select id="src">${SOURCES.map((s) => `<option value="${s}">${s === 'all' ? 'All sources' : s}</option>`).join('')}</select>
        <svg viewBox="0 0 24 24" fill="none"><path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <input id="q" type="text" placeholder="Filter…" spellcheck="false" />
      <button id="pause" class="dbg-btn" title="Pause stream">Pause</button>
      <button id="clear" class="dbg-btn" title="Clear log">Clear</button>
    </div>
  </header>
  <div class="dbg-incident" id="incident" hidden>
    <span class="dbg-inc-glyph">!</span>
    <div class="dbg-inc-body">
      <div class="dbg-inc-title">Incident detected</div>
      <div class="dbg-inc-msg" id="inc-msg"></div>
    </div>
    <button class="dbg-heal" id="heal">Heal</button>
    <button class="dbg-inc-x" id="inc-x" title="Dismiss">&times;</button>
  </div>
  <div class="dbg-log" id="log"></div>
  <footer class="dbg-foot">
    <span id="count">0 events</span>
    <span class="dbg-spacer"></span>
    <button class="dbg-link" id="reveal">Reveal logs</button>
    <label class="dbg-auto"><input type="checkbox" id="auto" checked /> Autoscroll</label>
  </footer>
`

const logEl = document.getElementById('log') as HTMLElement
const countEl = document.getElementById('count') as HTMLElement
const liveDot = document.getElementById('livedot') as HTMLElement
const liveTxt = document.getElementById('livetxt') as HTMLElement
const srcSel = document.getElementById('src') as HTMLSelectElement
const qInput = document.getElementById('q') as HTMLInputElement
const pauseBtn = document.getElementById('pause') as HTMLButtonElement
const clearBtn = document.getElementById('clear') as HTMLButtonElement
const autoBox = document.getElementById('auto') as HTMLInputElement
const incidentEl = document.getElementById('incident') as HTMLElement
const incMsgEl = document.getElementById('inc-msg') as HTMLElement
const healBtn = document.getElementById('heal') as HTMLButtonElement
const incXBtn = document.getElementById('inc-x') as HTMLButtonElement
const revealBtn = document.getElementById('reveal') as HTMLButtonElement

function fmtTime(t: number): string {
  const d = new Date(t)
  const p = (n: number, w = 2): string => String(n).padStart(w, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`
}

function passes(e: Entry): boolean {
  if (srcFilter !== 'all' && e.source !== srcFilter) return false
  if (query && !(`${e.source} ${e.msg}`.toLowerCase().includes(query))) return false
  return true
}

function rowFor(e: Entry): HTMLElement {
  const row = document.createElement('div')
  row.className = `dbg-row lvl-${e.level}`
  row.innerHTML = `
    <span class="dbg-time">${fmtTime(e.t)}</span>
    <span class="dbg-src src-${e.source}">${e.source}</span>
    <span class="dbg-msg"></span>
  `
  ;(row.querySelector('.dbg-msg') as HTMLElement).textContent = e.msg
  return row
}

function nearBottom(): boolean {
  return logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 40
}

function append(e: Entry): void {
  if (!passes(e)) return
  const stick = autoscroll && nearBottom()
  logEl.appendChild(rowFor(e))
  if (stick) logEl.scrollTop = logEl.scrollHeight
}

function renderAll(): void {
  logEl.replaceChildren()
  for (const e of entries) if (passes(e)) logEl.appendChild(rowFor(e))
  if (autoscroll) logEl.scrollTop = logEl.scrollHeight
}

function refreshCount(): void {
  const shown = entries.filter(passes).length
  countEl.textContent =
    shown === entries.length ? `${entries.length} events` : `${shown} of ${entries.length} events`
}

function ingest(e: Entry): void {
  entries.push(e)
  if (entries.length > 5000) entries.splice(0, entries.length - 5000)
  if (!paused) append(e)
  refreshCount()
}

// ---- controls ----
srcSel.addEventListener('change', () => {
  srcFilter = srcSel.value
  renderAll()
  refreshCount()
})
qInput.addEventListener('input', () => {
  query = qInput.value.trim().toLowerCase()
  renderAll()
  refreshCount()
})
pauseBtn.addEventListener('click', () => {
  paused = !paused
  pauseBtn.textContent = paused ? 'Resume' : 'Pause'
  pauseBtn.classList.toggle('on', paused)
  liveDot.classList.toggle('off', paused)
  liveTxt.textContent = paused ? 'paused' : 'live'
  if (!paused) renderAll()
})
clearBtn.addEventListener('click', () => {
  entries.length = 0
  window.dogfood.debug?.clear?.()
  renderAll()
  refreshCount()
})
autoBox.addEventListener('change', () => {
  autoscroll = autoBox.checked
  if (autoscroll) logEl.scrollTop = logEl.scrollHeight
})

// ---- incidents / self-heal ----
revealBtn.addEventListener('click', () => window.dogfood.debug?.revealLogs?.())
incXBtn.addEventListener('click', () => {
  window.dogfood.debug?.dismissIncident?.()
  incidentEl.hidden = true
})
healBtn.addEventListener('click', async () => {
  healBtn.disabled = true
  const r = await window.dogfood.debug?.heal?.()
  if (r) {
    healBtn.textContent = 'Prompt copied ✓'
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
  incidentEl.hidden = false
  healBtn.textContent = 'Heal'
  healBtn.disabled = false
})
window.dogfood.debug?.onIncidentCleared?.(() => {
  incidentEl.hidden = true
})
window.dogfood.debug?.ready?.()
