import React, { useState, useEffect, useRef, useContext } from 'react';
import { ThemeContext } from '../App';
import { Keyboard, RotateCcw } from 'lucide-react';

const WORDS = ["mühendis", "sistem", "mekanik", "yazılım", "algoritma", "termodinamik", "dinamik", "statik", "akışkanlar", "otomasyon", "robotik", "devre", "kodlama", "veritabanı", "sunucu", "ağ", "prototip", "imalat", "kalite", "kontrol", "veri", "tasarım", "grafik", "işlemci", "bellek"];

export default function GameTyping({ onGameOver }) {
  const { theme } = useContext(ThemeContext);
  const [words, setWords] = useState([]);
  const [input, setInput] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const inputRef = useRef(null);

  const startGame = () => {
    const shuffled = [...WORDS].sort(() => 0.5 - Math.random());
    setWords(shuffled);
    setInput('');
    setCurrentWordIndex(0);
    setCorrectWords(0);
    setTimeLeft(60);
    setIsPlaying(true);
    setGameOver(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => {
    if (timeLeft > 0 && isPlaying) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      setGameOver(true);
    }
  }, [timeLeft, isPlaying]);

  const handleInput = (e) => {
    if (!isPlaying && timeLeft === 60) startGame();
    
    const val = e.target.value;
    if (val.endsWith(' ')) {
      const word = val.trim();
      if (word === words[currentWordIndex]) {
        setCorrectWords(c => c + 1);
      }
      setCurrentWordIndex(i => i + 1);
      setInput('');
    } else {
      setInput(val);
    }
  };

  useEffect(() => {
  if (gameOver && onGameOver && correctWords > 0) onGameOver(correctWords);
}, [gameOver]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 relative">
      <div className="w-full max-w-[500px] flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl font-black text-white flex items-center gap-2">
            <Keyboard className="w-6 h-6" style={{ color: theme.hex }} /> Hız Testi
          </h3>
          <p className="text-xs text-gray-400 mt-1">Mühendislik terimlerini yaz</p>
        </div>
        <div className="text-right flex gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Süre</p>
            <p className={`text-2xl font-black font-mono ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">WPM</p>
            <p className="text-2xl font-black font-mono" style={{ color: theme.hex }}>{correctWords}</p>
          </div>
        </div>
      </div>

      {!gameOver ? (
        <div className="w-full max-w-[500px]">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-xl font-medium leading-relaxed mb-6 flex flex-wrap gap-2 text-gray-400">
            {words.slice(currentWordIndex, currentWordIndex + 6).map((word, i) => (
              <span key={i} className={i === 0 ? `font-black text-white px-2 rounded bg-white/10` : ''}>
                {word}
              </span>
            ))}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInput}
            disabled={gameOver}
            placeholder={isPlaying ? "" : "Başlamak için yazmaya başla..."}
            className="w-full bg-black/60 border border-white/20 rounded-xl py-4 px-6 text-white text-lg font-bold focus:outline-none focus:border-white/50 transition-all text-center shadow-2xl"
          />
        </div>
      ) : (
        <div className="w-full max-w-[400px] bg-black/40 border border-white/10 p-8 rounded-3xl flex flex-col items-center text-center">
          <h2 className="text-4xl font-black text-white mb-2">Süre Bitti!</h2>
          <p className="text-gray-400 mb-6">Yazma hızın dakikada <span style={{ color: theme.hex }} className="font-black text-2xl mx-1">{correctWords}</span> kelime.</p>
          <button onClick={startGame} className="px-8 py-4 rounded-xl bg-white text-black font-bold flex items-center gap-2 hover:scale-105 transition-transform">
            <RotateCcw className="w-5 h-5" /> Tekrar Oyna
          </button>
        </div>
      )}
    </div>
  );
}