import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../App';
import { RotateCcw, Activity } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const SPEED = 120; // Yılanın hızı (ms)

export default function GameSnake({ onGameOver }) {
  const { theme } = useContext(ThemeContext);
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const generateFood = (currentSnake) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) break;
    }
    return newFood;
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setFood(generateFood(INITIAL_SNAKE));
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const moveSnake = setInterval(() => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };

        // Duvara çarpma
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setGameOver(true); return prevSnake;
        }
        // Kendine çarpma
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true); return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Yem yeme
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop(); 
        }
        return newSnake;
      });
    }, SPEED);

    return () => clearInterval(moveSnake);
  }, [direction, food, gameOver, gameStarted]);

  // Oyun bittiğinde skoru Arcade.jsx'e gönder (Supabase'e yazılması için)
  useEffect(() => {
    if (gameOver && onGameOver && score > 0) {
      onGameOver(score);
    }
  }, [gameOver]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (!gameStarted) setGameStarted(true);
      }
      switch (e.key) {
        case 'ArrowUp': setDirection(prev => prev.y !== 1 ? { x: 0, y: -1 } : prev); break;
        case 'ArrowDown': setDirection(prev => prev.y !== -1 ? { x: 0, y: 1 } : prev); break;
        case 'ArrowLeft': setDirection(prev => prev.x !== 1 ? { x: -1, y: 0 } : prev); break;
        case 'ArrowRight': setDirection(prev => prev.x !== -1 ? { x: 1, y: 0 } : prev); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 relative z-10">
      <div className="w-full max-w-[400px] flex justify-between items-center mb-6">
        <div>
          <h3 className="text-3xl font-black text-white flex items-center gap-2">
            <Activity className="w-6 h-6" style={{ color: theme.hex }} /> Yılan
          </h3>
          <p className="text-xs text-gray-400">Yön tuşlarıyla oyna</p>
        </div>
        <div className="text-right flex gap-4 items-center">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Skor</p>
            <p className="text-2xl font-black font-mono" style={{ color: theme.hex }}>{score}</p>
          </div>
          <button onClick={resetGame} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white shadow-lg">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div 
        className="w-full max-w-[400px] aspect-square bg-black/50 border border-white/10 rounded-2xl relative shadow-2xl overflow-hidden"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}
      >
        {snake.map((segment, index) => (
          <div
            key={index}
            className="rounded-sm"
            style={{
              gridColumnStart: segment.x + 1, gridRowStart: segment.y + 1,
              backgroundColor: index === 0 ? theme.hex : theme.hex + '90', 
              boxShadow: index === 0 ? `0 0 10px ${theme.hex}` : 'none', zIndex: 10
            }}
          />
        ))}
        <div
          className="rounded-full animate-pulse"
          style={{ gridColumnStart: food.x + 1, gridRowStart: food.y + 1, backgroundColor: '#ef4444', boxShadow: '0 0 10px #ef4444', zIndex: 5 }}
        />

        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <p className="text-white font-bold mb-4">Başlamak için bir yön tuşuna bas</p>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20 border border-red-500/30 rounded-2xl">
            <h2 className="text-4xl font-black text-white mb-2">Oyun Bitti!</h2>
            <p className="text-gray-300 mb-6 text-lg">Skorun: <span style={{ color: theme.hex }} className="font-bold text-2xl mx-1">{score}</span></p>
            <button onClick={resetGame} className="px-6 py-3 rounded-xl bg-white text-black font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl">
              <RotateCcw className="w-5 h-5" /> Tekrar Oyna
            </button>
          </div>
        )}
      </div>
    </div>
  );
}