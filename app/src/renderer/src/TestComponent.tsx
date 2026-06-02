// A throwaway sample component so the pointer (select) tool has real elements
// to hover and click. Self-contained inline styles so it renders consistently.
export default function TestComponent(): JSX.Element {
  return (
    <div
      style={{
        width: 320,
        background: '#ffffff',
        borderRadius: 18,
        boxShadow: '0 1px 2px rgba(0,0,0,.05), 0 14px 36px rgba(0,0,0,.12)',
        padding: 22,
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        color: '#1c1c1e'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e6f8ec', display: 'grid', placeItems: 'center', fontSize: 22 }}>
          🐶
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.01em' }}>Cowboy</div>
          <div style={{ fontSize: 13, color: '#8e8e93' }}>Good boy · online</div>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#34c759', background: '#e6f8ec', padding: '4px 10px', borderRadius: 999 }}>
          Active
        </span>
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.5, color: '#3a3a3c', margin: '0 0 18px' }}>
        A sample component. Toggle the pointer, then click any piece — the title, the badge, a button — to select it.
      </p>

      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{ flex: 1, border: 0, background: '#007aff', color: '#fff', fontWeight: 600, fontSize: 14, padding: '10px 0', borderRadius: 11, cursor: 'pointer' }}>
          Primary
        </button>
        <button style={{ flex: 1, border: '1px solid #e5e5ea', background: '#fff', color: '#1c1c1e', fontWeight: 600, fontSize: 14, padding: '10px 0', borderRadius: 11, cursor: 'pointer' }}>
          Secondary
        </button>
      </div>
    </div>
  )
}
