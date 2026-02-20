interface Props {
  onStart: () => void;
}

export default function MainMenu({ onStart }: Props) {
  return (
    <div style={overlay}>
      <h1 style={{ fontSize: 48, margin: 0, letterSpacing: 4, color: '#00e5ff', textShadow: '0 0 20px #00e5ff' }}>
        SPACE MARINE
      </h1>
      <p style={{ color: '#aaa', marginTop: 8, letterSpacing: 2 }}>A SCI-FI COMBAT PLATFORMER</p>
      <div style={{ marginTop: 40, color: '#ccc', fontSize: 14, lineHeight: 2 }}>
        <div><kbd>← → / A D</kbd> Move</div>
        <div><kbd>Space / W / ↑</kbd> Jump (double-jump!)</div>
        <div><kbd>Z</kbd> Melee attack</div>
        <div><kbd>X</kbd> Shoot (10 ammo)</div>
        <div><kbd>C</kbd> Grenade (5 grenades)</div>
      </div>
      <button onClick={onStart} style={btn}>▶ START MISSION</button>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.85)',
  fontFamily: 'monospace',
  color: '#fff',
};

const btn: React.CSSProperties = {
  marginTop: 36,
  padding: '14px 40px',
  fontSize: 18,
  background: '#00e5ff',
  color: '#000',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontWeight: 'bold',
  letterSpacing: 2,
};
