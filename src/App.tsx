import { useRef, useState, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import MainMenu from './components/MainMenu';
import GameOver, { WinScreen } from './components/GameOver';
import { GameEngine } from './game/engine';
import type { GameState } from './game/engine';

type Screen = 'menu' | 'playing' | 'dead' | 'win';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [gameState, setGameState] = useState<GameState>({ hp: 3, ammo: 10, score: 0, status: 'playing' });
  const engineRef = useRef<GameEngine | null>(null);

  const handleStateChange = useCallback((s: GameState) => {
    setGameState(s);
    if (s.status === 'dead') setScreen('dead');
    if (s.status === 'win') setScreen('win');
  }, []);

  const handleStart = () => {
    if (engineRef.current) engineRef.current.paused = false;
    setScreen('playing');
    setGameState({ hp: 3, ammo: 10, score: 0, status: 'playing' });
  };

  const handleRetry = () => {
    engineRef.current?.reset();
    if (engineRef.current) engineRef.current.paused = false;
    setScreen('playing');
    setGameState({ hp: 3, ammo: 10, score: 0, status: 'playing' });
  };

  return (
    <>
      <GameCanvas onStateChange={handleStateChange} engineRef={engineRef} />
      {screen === 'playing' && (
        <HUD hp={gameState.hp} ammo={gameState.ammo} score={gameState.score} />
      )}
      {screen === 'menu' && <MainMenu onStart={handleStart} />}
      {screen === 'dead' && <GameOver score={gameState.score} onRetry={handleRetry} />}
      {screen === 'win' && <WinScreen score={gameState.score} onRetry={handleRetry} />}
    </>
  );
}

export default App;
