import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../App';
import { RefreshCw } from 'lucide-react';

export default function Game2048({ onGameOver }) {
  const { theme } = useContext(ThemeContext);
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const initialize = () => {
    let newGrid = Array(4).fill().map(() => Array(4).fill(0));
    addRandom(newGrid);
    addRandom(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
  };

  const addRandom = (currentGrid) => {
    let empty = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentGrid[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length > 0) {
      let { r, c } = empty[Math.floor(Math.random() * empty.length)];
      currentGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  };

  const slide = (row) => {
    let arr = row.filter(val => val !== 0);
    let missing = 4 - arr.length;
    let zeros = Array(missing).fill(0);
    return arr.concat(zeros);
  };

  const combine = (row) => {
    let scoreAcc = 0;
    for (let i = 0; i < 3; i++) {
      if (row[i] !== 0 && row[i] === row[i + 1]) {
        row[i] = row[i] * 2;
        row[i + 1] = 0;
        scoreAcc += row[i];
      }
    }
    return { row, scoreAcc };
  };

  const rotateLeft = (matrix) => {
    const result = [];
    for (let i = 0; i < 4; i++) {
      result.push([matrix[0][3-i], matrix[1][3-i], matrix[2][3-i], matrix[3][3-i]]);
    }
    return result;
  };

  const rotateRight = (matrix) => {
    const result = [];
    for (let i = 0; i < 4; i++) {
      result.push([matrix[3][i], matrix[2][i], matrix[1][i], matrix[0][i]]);
    }
    return result;
  };

  const checkGameOver = (currentGrid) => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentGrid[r][c] === 0) return false;
        if (c !== 3 && currentGrid[r][c] === currentGrid[r][c + 1]) return false;
        if (r !== 3 && currentGrid[r][c] === currentGrid[r + 1][c]) return false;
      }
    }
    setGameOver(true);
  };

  const move = (direction) => {
    if (gameOver) return;
    let newGrid = JSON.parse(JSON.stringify(grid));
    let flipped = false;
    let rotated = false;
    let newScore = 0;

    if (direction === 'ArrowLeft') { /* Sabit */ } 
    else if (direction === 'ArrowRight') { newGrid = newGrid.map(row => [...row].reverse()); flipped = true; } 
    else if (direction === 'ArrowUp') { newGrid = rotateLeft(newGrid); rotated = true; } 
    else if (direction === 'ArrowDown') { newGrid = rotateRight(newGrid); rotated = true; } 
    else return;

    let moved = false;
    for (let i = 0; i < 4; i++) {
      let row = newGrid[i];
      let originalRow = [...row];
      
      row = slide(row);
      let combined = combine(row);
      row = slide(combined.row);
      
      newScore += combined.scoreAcc;
      newGrid[i] = row;
      
      if (originalRow.join(',') !== row.join(',')) moved = true;
    }

    if (flipped) newGrid = newGrid.map(row => row.reverse());
    else if (rotated && direction === 'ArrowUp') newGrid = rotateRight(newGrid);
    else if (rotated && direction === 'ArrowDown') newGrid = rotateLeft(newGrid);

    if (moved) {
      addRandom(newGrid);
      setGrid(newGrid);
      setScore(s => s + newScore);
      checkGameOver(newGrid);
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Yön tuşlarının ekranı kaydırmasını engelle ve oyuna aktar
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        move(e.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [grid, gameOver]);

  // Yeni Şık ve Canlı Renk Paleti
  const getTileStyle = (val) => {
    if (val === 0) return { background: 'rgba(255,255,255,0.02)', color: 'transparent' };
    if (val === 2) return { background: '#1e293b', color: '#cbd5e1' }; // Soluk gri-mavi
    if (val === 4) return { background: '#334155', color: '#f8fafc' }; // Biraz daha parlak gri
    if (val === 8) return { background: '#4f46e5', color: '#ffffff' }; // Koyu indigo
    if (val === 16) return { background: '#7c3aed', color: '#ffffff' }; // Mor
    if (val === 32) return { background: '#c026d3', color: '#ffffff' }; // Fuşya
    if (val === 64) return { background: '#e11d48', color: '#ffffff', boxShadow: '0 0 10px rgba(225,29,72,0.4)' }; // Gül kurusu/kırmızı ve parlama başlar
    if (val === 128) return { background: '#ea580c', color: '#ffffff', boxShadow: '0 0 15px rgba(234,88,12,0.5)' }; // Turuncu
    if (val === 256) return { background: '#f59e0b', color: '#000000', boxShadow: '0 0 15px rgba(245,158,11,0.6)' }; // Sarı/Kehribar
    if (val === 512) return { background: '#10b981', color: '#000000', boxShadow: '0 0 15px rgba(16,185,129,0.7)' }; // Zümrüt yeşili
    if (val === 1024) return { background: '#06b6d4', color: '#000000', boxShadow: '0 0 20px rgba(6,182,212,0.8)' }; // Açık mavi / Camgöbeği
    if (val >= 2048) return { background: theme.hex, color: '#000000', textShadow: 'none', boxShadow: `0 0 30px ${theme.hex}` }; // Nihai zafer taşı, senin temanın renginde parlar!
  };

  useEffect(() => {
    if (gameOver && onGameOver && score > 0) onGameOver(score);
  }, [gameOver]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 relative z-10">
      
      <div className="w-full max-w-[400px] flex justify-between items-center mb-6">
        <div>
          <h3 className="text-3xl font-black text-white">2048</h3>
          <p className="text-xs text-gray-400">Yön tuşlarını kullan</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Skor</p>
            <p className="text-2xl font-black font-mono" style={{ color: theme.hex }}>{score}</p>
          </div>
          <button onClick={initialize} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white shadow-lg">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="w-full max-w-[400px] bg-black/50 border border-white/10 p-3 rounded-2xl grid grid-cols-4 gap-3 relative shadow-2xl">
        {grid.map((row, rIdx) => 
          row.map((val, cIdx) => (
            <div 
              key={`${rIdx}-${cIdx}`} 
              className="aspect-square flex items-center justify-center rounded-xl font-black text-2xl transition-all duration-200 ease-out"
              style={getTileStyle(val)}
            >
              {val !== 0 ? val : ''}
            </div>
          ))
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center z-10 border border-red-500/30">
            <h2 className="text-4xl font-black text-white mb-2">Oyun Bitti!</h2>
            <p className="text-gray-300 mb-6 text-lg">Skorun: <span style={{ color: theme.hex }} className="font-bold text-2xl mx-1">{score}</span></p>
            <button onClick={initialize} className="px-6 py-3 rounded-xl bg-white text-black font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl">
              <RefreshCw className="w-5 h-5" /> Tekrar Dene
            </button>
          </div>
        )}
      </div>
    </div>
  );
}