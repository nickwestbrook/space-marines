interface Props {
  score: number;
  onRetry: () => void;
}

export default function GameOver({ score, onRetry }: Props) {
  return (
    <div style={overlay}>
      <h1 style={{ fontSize: 52, margin: 0, color: '#e74c3c', textShadow: '0 0 20px #e74c3c' }}>
        MISSION FAILED
      </h1>
      <p style={{ color: '#aaa', marginTop: 12, fontSize: 20 }}>Kills: {score}</p>
      <button onClick={onRetry} style={btn}>↺ RETRY</button>
    </div>
  );
}

interface WinProps {
  score: number;
  onRetry: () => void;
}

export function WinScreen({ score, onRetry }: WinProps) {
  return (
    <div style={overlay}>
      <h1 style={{ fontSize: 48, margin: 0, color: '#2ecc71', textShadow: '0 0 20px #2ecc71' }}>
        MISSION COMPLETE
      </h1>
      <p style={{ color: '#aaa', marginTop: 12, fontSize: 20 }}>Kills: {score}</p>
      <button onClick={onRetry} style={btn}>▶ PLAY AGAIN</button>
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
  background: '#fff',
  color: '#000',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontWeight: 'bold',
  letterSpacing: 2,
};
