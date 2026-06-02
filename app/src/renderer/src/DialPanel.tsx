import { useState } from 'react'
import { Folder, Slider, Toggle } from 'dialkit'
import Terminal from './Terminal'

// The terminal lives inside a DialKit panel — a dialkit Folder hosts the real
// terminal, with demo dials below (live wiring comes once the preview exists).
export default function DialPanel({
  open,
  projectKey,
  theme
}: {
  open: boolean
  projectKey: string
  theme: 'light' | 'dark'
}): JSX.Element {
  const [blur, setBlur] = useState(24)
  const [scale, setScale] = useState(1.2)
  const [glow, setGlow] = useState(true)

  return (
    <div className={`dialpanel ${open ? 'open' : ''}`}>
      <Folder title="claude — terminal" defaultOpen>
        <div className="dialpanel-term">
          <Terminal projectKey={projectKey} theme={theme} />
        </div>
      </Folder>
      <Folder title="Tweaks" defaultOpen>
        <Slider label="Blur" value={blur} min={0} max={100} onChange={setBlur} unit="px" />
        <Slider label="Scale" value={scale} min={0} max={3} step={0.01} onChange={setScale} />
        <Toggle label="Glow" checked={glow} onChange={setGlow} />
      </Folder>
    </div>
  )
}
