import { useEffect, useRef } from 'react'
import { Terminal as Xterm, type ITheme } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'

// xterm theme per app theme. Background is transparent so the glass/surface
// behind the shelf shows through; only the text color flips.
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

// A real terminal: xterm in the renderer, a node-pty shell in main.
// Type `claude` to start Claude Code, or anything else — it's a real shell.
export default function Terminal({
  projectKey,
  theme
}: {
  projectKey: string
  theme: 'light' | 'dark'
}): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Xterm | null>(null)

  useEffect(() => {
    if (!hostRef.current) return
    const term = new Xterm({
      fontFamily: 'var(--mono), Menlo, monospace',
      fontSize: 12.5,
      lineHeight: 1.35,
      cursorBlink: true,
      allowProposedApi: true,
      allowTransparency: true,
      theme: xtermTheme(theme)
    })
    termRef.current = term
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(hostRef.current)

    const safeFit = (): void => {
      try { fit.fit() } catch { /* noop */ }
    }
    safeFit()

    let disposed = false
    const api = window.dogfood

    api.pty.start({ cols: term.cols, rows: term.rows }).then(() => {
      if (disposed) return
      api.pty.resize(term.cols, term.rows)
    })

    const offData = api.pty.onData((d) => term.write(d))
    const offExit = api.pty.onExit(() => term.write('\r\n\x1b[90m[process exited]\x1b[0m\r\n'))
    term.onData((d) => api.pty.write(d))

    const onResize = (): void => {
      safeFit()
      api.pty.resize(term.cols, term.rows)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(hostRef.current)
    window.addEventListener('resize', onResize)

    term.focus()

    return () => {
      disposed = true
      offData()
      offExit()
      ro.disconnect()
      window.removeEventListener('resize', onResize)
      term.dispose()
      termRef.current = null
    }
  }, [projectKey])

  // live-swap the theme without losing the session
  useEffect(() => {
    if (termRef.current) termRef.current.options.theme = xtermTheme(theme)
  }, [theme])

  return <div className="term-wrap"><div ref={hostRef} style={{ height: '100%' }} /></div>
}
