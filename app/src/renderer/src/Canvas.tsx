// Dogfood canvas — backed by @grida/svg-editor (Grida's headless SVG editing engine).
// A crisp, embeddable editing surface; the toolbar/panels are OURS to build with the
// editor hooks (useTool, useSelection, useCommands, usePropertyPreview, …).
// Replaces the earlier Excalidraw spike. DOM/SVG, no WASM.
import { SvgEditorProvider, SvgEditorCanvas } from '@grida/svg-editor/react'

// Placeholder content so the surface isn't blank on first run — clear/replace freely.
const STARTER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect x="220" y="240" width="260" height="170" rx="16" fill="#a5d8ff" stroke="#1e1e1e" stroke-width="2"/>
  <circle cx="660" cy="330" r="100" fill="#b2f2bb" stroke="#1e1e1e" stroke-width="2"/>
  <text x="240" y="520" font-family="-apple-system, Inter, sans-serif" font-size="48" fill="#1e1e1e">Dogfood × Grida</text>
</svg>`

export default function Canvas({ theme }: { theme: 'light' | 'dark' }): JSX.Element {
  return (
    <div
      data-theme={theme}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: theme === 'dark' ? '#1c1c1e' : '#ffffff'
      }}
    >
      <SvgEditorProvider initialSvg={STARTER_SVG}>
        <SvgEditorCanvas style={{ position: 'absolute', inset: 0 }} fit />
      </SvgEditorProvider>
    </div>
  )
}
