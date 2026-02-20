import { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine';
import type { GameState } from '../game/engine';

interface Props {
  onStateChange: (s: GameState) => void;
  engineRef: React.MutableRefObject<GameEngine | null>;
}

export default function GameCanvas({ onStateChange, engineRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const engine = new GameEngine(canvas, onStateChange);
    engineRef.current = engine;
    engine.start();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      engine.stop();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', position: 'fixed', top: 0, left: 0 }}
    />
  );
}
