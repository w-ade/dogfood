import { useEffect, useRef } from 'react'
import { Terminal as Xterm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'

// A real terminal: xterm in the renderer, a node-pty shell in main.
// Type `claude` to start Claude Code, or anything else — it's a real shell.
export default function Terminal({ projectKey }: { projectKey: string }): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hostRef.current) return
    const term = new Xterm({
      fontFamily: 'var(--mono), Menlo, monospace',
      fontSize: 12.5,
      lineHeight: 1.35,
      cursorBlink: true,
      allowProposedApi: true,
      theme: {
        background: '#ffffff',
        foreground: '#1c1c1e',
        cursor: '#007aff',
        selectionBackground: '#e9f2ff',
        black: '#1c1c1e', red: '#ff3b30', green: '#34c759', yellow: '#ff9500',
        blue: '#007aff', magenta: '#af52de', cyan: '#5ac8fa', white: '#8e8e93',
        brightBlack: '#aeaeb2', brightRed: '#ff6482', brightGreen: '#30d158',
        brightYellow: '#ffd60a', brightBlue: '#409cff', brightMagenta: '#da8fff',
        brightCyan: '#70d7ff', brightWhite: '#1c1c1e'
      }
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(hostRef.current)

    const safeFit = (): void => {
      try { fit.fit() } catch { /* noop */ }
    }
    safeFit()

    let disposed = false
    const api = window.dogfood

    // start the pty sized to the current terminal, then stream both ways
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
    }
    // re-create the terminal when the project changes (new pty cwd)
  }, [projectKey])

  return <div className="term-wrap"><div ref={hostRef} style={{ height: '100%' }} /></div>
}
