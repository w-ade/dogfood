interface Window {
  dogfood: {
    openProject: () => Promise<{ path: string; name: string } | null>
    currentProject: () => Promise<{ path: string; name: string }>
    listComponents: () => Promise<string[]>
    activity: () => Promise<{ hash: string; subject: string; when: string; current: boolean }[]>
    reveal: (p: string) => Promise<void>
    theme: {
      set: (mode: 'light' | 'dark' | 'system') => Promise<boolean>
      get: () => Promise<boolean>
    }
    debug: {
      emit: (level: string, source: string, msg: string) => void
      ready: () => void
      clear: () => void
      toggle: () => void
      onLine: (cb: (e: { t: number; level: string; source: string; msg: string }) => void) => () => void
      onCleared: (cb: () => void) => () => void
    }
    pty: {
      start: (id: string, opts: { cols?: number; rows?: number }) => Promise<boolean>
      write: (id: string, d: string) => void
      resize: (id: string, cols: number, rows: number) => void
      kill: (id: string) => void
      onData: (cb: (id: string, d: string) => void) => () => void
      onExit: (cb: (id: string) => void) => () => void
    }
  }
}
