import { contextBridge, ipcRenderer } from 'electron'

const api = {
  openProject: () => ipcRenderer.invoke('dialog:openProject') as Promise<{ path: string; name: string } | null>,
  currentProject: () => ipcRenderer.invoke('project:current') as Promise<{ path: string; name: string }>,
  listComponents: () => ipcRenderer.invoke('fs:listComponents') as Promise<string[]>,
  activity: () => ipcRenderer.invoke('activity:list') as Promise<
    { hash: string; subject: string; when: string; current: boolean }[]
  >,
  reveal: (p: string) => ipcRenderer.invoke('shell:reveal', p),
  theme: {
    set: (mode: 'light' | 'dark' | 'system') => ipcRenderer.invoke('theme:set', mode) as Promise<boolean>,
    get: () => ipcRenderer.invoke('theme:get') as Promise<boolean>
  },
  debug: {
    // app side: push a line into the stream
    emit: (level: string, source: string, msg: string) =>
      ipcRenderer.send('debug:emit', { level, source, msg }),
    // debug window: replay buffer + subscribe
    ready: () => ipcRenderer.send('debug:ready'),
    clear: () => ipcRenderer.send('debug:clear'),
    toggle: () => ipcRenderer.send('debug:toggle'),
    onLine: (cb: (e: { t: number; level: string; source: string; msg: string }) => void) => {
      const h = (_e: unknown, entry: { t: number; level: string; source: string; msg: string }): void => cb(entry)
      ipcRenderer.on('debug:line', h)
      return () => ipcRenderer.removeListener('debug:line', h)
    },
    onCleared: (cb: () => void) => {
      const h = (): void => cb()
      ipcRenderer.on('debug:cleared', h)
      return () => ipcRenderer.removeListener('debug:cleared', h)
    },
    // self-heal
    heal: () => ipcRenderer.invoke('debug:heal') as Promise<{ id: string; path: string; prompt: string } | null>,
    dismissIncident: () => ipcRenderer.send('debug:dismiss-incident'),
    revealLogs: () => ipcRenderer.invoke('debug:reveal-logs') as Promise<string>,
    onIncident: (cb: (i: { id: string; level: string; source: string; msg: string }) => void) => {
      const h = (_e: unknown, i: { id: string; level: string; source: string; msg: string }): void => cb(i)
      ipcRenderer.on('debug:incident', h)
      return () => ipcRenderer.removeListener('debug:incident', h)
    },
    onIncidentCleared: (cb: () => void) => {
      const h = (): void => cb()
      ipcRenderer.on('debug:incident-cleared', h)
      return () => ipcRenderer.removeListener('debug:incident-cleared', h)
    }
  },
  pty: {
    start: (id: string, opts: { cols?: number; rows?: number }) => ipcRenderer.invoke('pty:start', { id, ...opts }) as Promise<boolean>,
    write: (id: string, d: string) => ipcRenderer.send('pty:write', { id, data: d }),
    resize: (id: string, cols: number, rows: number) => ipcRenderer.send('pty:resize', { id, cols, rows }),
    kill: (id: string) => ipcRenderer.send('pty:kill', { id }),
    onData: (cb: (id: string, d: string) => void) => {
      const h = (_e: unknown, p: { id: string; data: string }): void => cb(p.id, p.data)
      ipcRenderer.on('pty:data', h)
      return () => ipcRenderer.removeListener('pty:data', h)
    },
    onExit: (cb: (id: string) => void) => {
      const h = (_e: unknown, p: { id: string }): void => cb(p.id)
      ipcRenderer.on('pty:exit', h)
      return () => ipcRenderer.removeListener('pty:exit', h)
    }
  }
}

contextBridge.exposeInMainWorld('dogfood', api)

export type DogfoodApi = typeof api
