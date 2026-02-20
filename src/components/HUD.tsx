interface Props {
  hp: number;
  ammo: number;
  score: number;
  grenades: number;
}

export default function HUD({ hp, ammo, score, grenades }: Props) {
  const maxHp = 3;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 18px',
      pointerEvents: 'none',
      fontFamily: 'monospace',
    }}>
      {/* Health */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center',
        background: 'rgba(0,10,30,0.7)',
        border: '1px solid rgba(0,220,255,0.3)',
        borderRadius: 8, padding: '6px 12px',
        boxShadow: '0 0 12px rgba(0,180,255,0.2)',
      }}>
        <span style={{ fontSize: 11, color: '#00cfff', letterSpacing: 2, marginRight: 4 }}>HP</span>
        {Array.from({ length: maxHp }).map((_, i) => (
          <div key={i} style={{
            width: 20, height: 20,
            background: i < hp
              ? 'linear-gradient(135deg,#e74c3c,#c0392b)'
              : 'rgba(255,255,255,0.05)',
            border: `1px solid ${i < hp ? '#ff6060' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 4,
            boxShadow: i < hp ? '0 0 8px #e74c3c' : 'none',
          }} />
        ))}
      </div>

      {/* Score */}
      <div style={{
        fontSize: 16, fontWeight: 'bold', letterSpacing: 3,
        color: '#00ff88',
        background: 'rgba(0,10,30,0.7)',
        border: '1px solid rgba(0,255,136,0.3)',
        borderRadius: 8, padding: '6px 16px',
        boxShadow: '0 0 12px rgba(0,255,136,0.15)',
        textShadow: '0 0 10px #00ff88',
      }}>
        KILLS: {score}
      </div>

      {/* Ammo + Grenades */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{
          background: 'rgba(0,10,30,0.7)',
          border: '1px solid rgba(0,220,255,0.3)',
          borderRadius: 8, padding: '6px 14px',
          boxShadow: '0 0 12px rgba(0,180,255,0.2)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 11, color: '#00cfff', letterSpacing: 2 }}>AMMO</span>
          <span style={{
            fontSize: 22, fontWeight: 'bold',
            color: ammo > 3 ? '#00e5ff' : '#ff6060',
            textShadow: `0 0 10px ${ammo > 3 ? '#00e5ff' : '#ff6060'}`,
          }}>{ammo}</span>
        </div>
        <div style={{
          background: 'rgba(0,10,30,0.7)',
          border: '1px solid rgba(255,160,0,0.4)',
          borderRadius: 8, padding: '6px 14px',
          boxShadow: '0 0 12px rgba(255,120,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>💣</span>
          <span style={{
            fontSize: 22, fontWeight: 'bold',
            color: grenades > 0 ? '#ffaa00' : '#ff6060',
            textShadow: `0 0 10px ${grenades > 0 ? '#ffaa00' : '#ff6060'}`,
            fontFamily: 'monospace',
          }}>{grenades}</span>
        </div>
      </div>
    </div>
  );
}
