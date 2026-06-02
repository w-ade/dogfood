import { useEffect, useRef } from 'react'
import { Terminal as Xterm, type ITheme } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'

// xterm theme per app theme. Background transparent so the glass shows through.
function xtermTheme(theme: 'light' | 'dark'): ITheme {
  const dark = theme === 'dark'
  return {
    background: 'rgba(0,0,0,0)',
    foreground: dark ? '#ECECEF' : '#1c1c1e',
    cursor: '#007aff',
    selectionBackground: dark ? 'rgba(255,255,255,.18)' : '#d6e7ff',
    black: dark ? '#ECECEF' : '#1c1c1e', red: '#ff3b30', green: '#34c759', yellow: '#ff9500',
    blue: '#007aff', magenta: '#af52de', cyan: '#5ac8fa', white: dark ? '#9a9aa0' : '#8e8e93',
    brightBlack: '#aeaeb2', brightRed: '#ff6482', brightGreen: '#30d158',
    brightYellow: '#ffd60a', brightBlue: '#409cff', brightMagenta: '#da8fff',
    brightCyan: '#70d7ff', brightWhite: dark ? '#ffffff' : '#1c1c1e'
  }
}

// One real terminal session, keyed by `id` (each tab is a separate pty).
export default function Terminal({
  id,
  theme
}: {
  id: string
  theme: 'light' | 'dark'
}): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Xterm | null>(null)

  useEffect(() => {
    if (!hostRef.current) return
    const term = new Xterm({
      fontFamily: '"Geist Mono", ui-monospace, Menlo, monospace',
      fontSize: 13,
      fontWeight: 400,
      fontWeightBold: 600,
      lineHeight: 1.2,
      letterSpacing: 0,
      cursorBlink: true,
      allowProposedApi: true,
      allowTransparency: true,
      theme: xtermTheme(theme)
    })
    termRef.current = term
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(hostRef.current)

    // Only fit when the terminal is actually visible and laid out. Fitting a
    // zero-size or display:none terminal makes xterm read `dimensions` off an
    // uninitialized render service and throw.
    const safeFit = (): void => {
      const el = hostRef.current
      if (!el || el.offsetParent === null || el.clientWidth === 0 || el.clientHeight === 0) return
      try { fit.fit() } catch { /* noop */ }
    }
    safeFit()

    let disposed = false
    const api = window.dogfood

    api.pty.start(id, { cols: term.cols, rows: term.rows }).then(() => {
      if (disposed) return
      api.pty.resize(id, term.cols, term.rows)
      // focus once the session is live and the element is laid out
      term.focus()
    })

    const offData = api.pty.onData((tid, d) => { if (tid === id) term.write(d) })
    const offExit = api.pty.onExit((tid) => { if (tid === id) term.write('\r\n\x1b[90m[process exited]\x1b[0m\r\n') })
    term.onData((d) => api.pty.write(id, d))

    const onResize = (): void => {
      safeFit()
      api.pty.resize(id, term.cols, term.rows)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(hostRef.current)
    window.addEventListener('resize', onResize)

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (disposed) return
        safeFit()
        api.pty.resize(id, term.cols, term.rows)
      })
    }

    term.focus()

    return () => {
      disposed = true
      offData()
      offExit()
      ro.disconnect()
      window.removeEventListener('resize', onResize)
      api.pty.kill(id)
      term.dispose()
      termRef.current = null
    }
  }, [id])

  // live-swap theme without losing the session
  useEffect(() => {
    if (termRef.current) termRef.current.options.theme = xtermTheme(theme)
  }, [theme])

  // click anywhere in the terminal to focus it (so keystrokes reach the pty)
  return (
    <div className="term-wrap" onMouseDown={() => termRef.current?.focus()}>
      <div ref={hostRef} style={{ height: '100%' }} />
    </div>
  )
}
