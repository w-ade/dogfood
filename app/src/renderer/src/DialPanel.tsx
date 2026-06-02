import { Folder } from 'dialkit'
import Terminal from './Terminal'

// The terminal lives inside a DialKit panel that slides in from the right.
export default function DialPanel({
  open,
  projectKey,
  theme
}: {
  open: boolean
  projectKey: string
  theme: 'light' | 'dark'
}): JSX.Element {
  return (
    <div className={`dialpanel ${open ? 'open' : ''}`}>
      <Folder title="claude — terminal" defaultOpen>
        <div className="dialpanel-term">
          <Terminal projectKey={projectKey} theme={theme} />
        </div>
      </Folder>
    </div>
  )
}
