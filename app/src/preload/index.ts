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
