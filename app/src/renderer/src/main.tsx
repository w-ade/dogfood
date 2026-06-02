import ReactDOM from 'react-dom/client'
import App from './App'
import '@xterm/xterm/css/xterm.css'
import 'dialkit/styles.css'
import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-mono/600.css'
import './styles.css'

// ---- debug stream instrumentation -------------------------------------
// Forward the renderer's console, runtime errors, and Vite's dev/build
// stream (HMR) into the standalone debug-logger window via the main process.
{
  const emit = (level: string, source: string, msg: string): void => {
    try { window.dogfood?.debug?.emit?.(level, source, msg) } catch { /* noop */ }
  }
  const fmt = (a: unknown): string => {
    if (typeof a === 'string') return a
    if (a instanceof Error) return a.stack || a.message
    try { return JSON.stringify(a) } catch { return String(a) }
  }
  ;(['log', 'info', 'warn', 'error'] as const).forEach((m) => {
    const orig = console[m].bind(console)
    console[m] = (...args: unknown[]): void => {
      orig(...args)
      emit(m === 'log' ? 'log' : m, 'renderer', args.map(fmt).join(' '))
    }
  })
  window.addEventListener('error', (e) =>
    emit('error', 'renderer', `${e.message} (${e.filename}:${e.lineno})`)
  )
  window.addEventListener('unhandledrejection', (e) =>
    emit('error', 'renderer', `unhandledrejection: ${fmt(e.reason)}`)
  )
  if (import.meta.hot) {
    import.meta.hot.on('vite:beforeUpdate', (p) =>
      emit('info', 'build', `HMR update — ${p.updates.map((u) => u.path).join(', ')}`)
    )
    import.meta.hot.on('vite:afterUpdate', () => emit('info', 'build', 'HMR applied'))
    import.meta.hot.on('vite:error', (p) =>
      emit('error', 'build', p.err?.message || 'HMR error')
    )
  }
  emit('system', 'renderer', 'renderer loaded')
}

// No StrictMode: its dev-only double-mount restarts the live pty on every mount
// (spamming the debug stream and racing the cleanup kill against the new session).
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />)
