// Excalidraw embedded as Dogfood's canvas, mounted in .cc-editor — mirrors how the
// terminal mounts in .cc-panel. Toolbar is trimmed via UIOptions (no fork needed);
// vendor/fork the package later if we want to restyle, reorder, or add custom tools.
import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'

export default function Canvas({ theme }: { theme: 'light' | 'dark' }): JSX.Element {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Excalidraw
        theme={theme}
        // Step 2 of the plan lives here: trim the toolbar via UIOptions, no fork.
        UIOptions={{
          tools: { image: false }
        }}
      />
    </div>
  )
}
