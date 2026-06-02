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
    pty: {
      start: (opts: { cols?: number; rows?: number }) => Promise<boolean>
      write: (d: string) => void
      resize: (cols: number, rows: number) => void
      onData: (cb: (d: string) => void) => () => void
      onExit: (cb: () => void) => () => void
    }
  }
}
