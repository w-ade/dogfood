import { contextBridge, ipcRenderer } from 'electron'

const api = {
  openProject: () => ipcRenderer.invoke('dialog:openProject') as Promise<{ path: string; name: string } | null>,
  currentProject: () => ipcRenderer.invoke('project:current') as Promise<{ path: string; name: string }>,
  listComponents: () => ipcRenderer.invoke('fs:listComponents') as Promise<string[]>,
  activity: () => ipcRenderer.invoke('activity:list') as Promise<
    { hash: string; subject: string; when: string; current: boolean }[]
  >,
  reveal: (p: string) => ipcRenderer.invoke('shell:reveal', p),
  pty: {
    start: (opts: { cols?: number; rows?: number }) => ipcRenderer.invoke('pty:start', opts) as Promise<boolean>,
    write: (d: string) => ipcRenderer.send('pty:write', d),
    resize: (cols: number, rows: number) => ipcRenderer.send('pty:resize', { cols, rows }),
    onData: (cb: (d: string) => void) => {
      const h = (_e: unknown, d: string): void => cb(d)
      ipcRenderer.on('pty:data', h)
      return () => ipcRenderer.removeListener('pty:data', h)
    },
    onExit: (cb: () => void) => {
      const h = (): void => cb()
      ipcRenderer.on('pty:exit', h)
      return () => ipcRenderer.removeListener('pty:exit', h)
    }
  }
}

contextBridge.exposeInMainWorld('dogfood', api)

export type DogfoodApi = typeof api
