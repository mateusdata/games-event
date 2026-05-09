"use client";

import { useEffect, useRef, useState } from "react";
import { motion, PanInfo } from "framer-motion";

function playTone(freq: number, type: "sine" | "square" | "sawtooth" | "triangle" = "square", durationMs = 400) {
  const g = globalThis as any;
  const AudioContext = g.AudioContext || g.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + durationMs / 1000);
}

type Level = { name: string; size: number; time: number };
const LEVELS: Level[] = [
  { name: "INICIANTE", size: 2, time: 30 },
  { name: "INTERMEDIÁRIO", size: 3, time: 60 },
  { name: "AVANÇADO", size: 4, time: 120 }
];

export default function PuzzleGame() {
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [isMemorizing, setIsMemorizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [placedPieces, setPlacedPieces] = useState<number[]>([]);
  const [shuffledPieces, setShuffledPieces] = useState<number[]>([]);

  const boardSize = 320; 
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (isPlaying && timeLeft === 0) {
      setGameOver(true);
      setIsPlaying(false);
      playTone(150, "sawtooth", 800);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  useEffect(() => {
    if (selectedLevel && placedPieces.length === selectedLevel.size * selectedLevel.size) {
      setWon(true);
      setIsPlaying(false);
      playTone(600, "square", 150);
      setTimeout(() => playTone(800, "square", 200), 200);
      setTimeout(() => playTone(1200, "square", 400), 400);
    }
  }, [placedPieces, selectedLevel]);

  const startGame = (level: Level) => {
    playTone(400, "square", 100);
    setSelectedLevel(level);
    setPlacedPieces([]);
    setGameOver(false);
    setWon(false);
    
    const total = level.size * level.size;
    const pieces = Array.from({ length: total }, (_, i) => i);
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    setShuffledPieces(pieces);
    slotRefs.current = new Array(total).fill(null);

    setIsMemorizing(true);
    setTimeout(() => {
      setIsMemorizing(false);
      setTimeLeft(level.time);
      setIsPlaying(true);
      playTone(800, "sine", 300);
    }, 5000);
  };

  const reset = () => {
    setSelectedLevel(null);
    setIsPlaying(false);
    setGameOver(false);
    setWon(false);
  };

  const handleDragEnd = (pieceId: number, info: PanInfo) => {
    if (!selectedLevel) return;
    const targetSlot = slotRefs.current[pieceId];
    if (!targetSlot) return;

    const rect = (targetSlot as any).getBoundingClientRect();
    const dropX = info.point.x;
    const dropY = info.point.y;

    if (
      dropX >= rect.left &&
      dropX <= rect.right &&
      dropY >= rect.top &&
      dropY <= rect.bottom
    ) {
      playTone(600, "sine", 100);
      setPlacedPieces(prev => [...prev, pieceId]);
    } else {
      playTone(200, "triangle", 100);
    }
  };

  if (!selectedLevel) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center font-mono p-5 text-white">
        <h1 className="text-4xl font-black mb-8 text-[#b300ff] drop-shadow-[0_0_20px_rgba(179,0,255,0.5)] tracking-tighter text-center">CYBER PUZZLE</h1>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          {LEVELS.map(level => (
            <button
              key={level.name}
              onClick={() => startGame(level)}
              className="bg-[#1a0033] border border-[#b300ff] p-4 text-[#b300ff] font-bold hover:bg-[#b300ff] hover:text-white transition-all shadow-[0_0_15px_rgba(179,0,255,0.2)]"
            >
              {level.name} ({level.size}x{level.size})
            </button>
          ))}
        </div>
      </div>
    );
  }

  const pieceSize = boardSize / selectedLevel.size;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-start pt-10 sm:justify-center sm:pt-0 font-mono p-5 relative overflow-hidden select-none">
      
      <div className="fixed inset-0 pointer-events-none z-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.08)_2px,rgba(0,0,0,0.08)_4px)]" />
      <div className="fixed top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(179,0,255,0.05)_0%,transparent_70%)]" />

      <div className="z-10 w-full max-w-[320px] flex justify-between items-center mb-4 text-[#b300ff]">
        <div className="text-xl font-bold">{timeLeft}s</div>
        <button onClick={reset} className="text-xs border border-[#b300ff] px-2 py-1 hover:bg-[#b300ff] hover:text-white transition-colors">VOLTAR</button>
      </div>

      {isMemorizing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f]/90 backdrop-blur-sm">
          <h2 className="text-[#b300ff] text-2xl font-black mb-4 animate-pulse">MEMORIZE A IMAGEM</h2>
          <div 
            style={{ width: boardSize, height: boardSize, backgroundImage: "url('/puzzle-bg.png')", backgroundSize: "cover" }} 
            className="border-2 border-[#b300ff] shadow-[0_0_30px_rgba(179,0,255,0.5)]"
          />
          <div className="mt-4 text-white text-xl">{timeLeft}</div>
        </div>
      )}

      <div 
        className="z-10 grid bg-[#111] border-2 border-[#b300ff]/30 shadow-[0_0_40px_rgba(179,0,255,0.15)]"
        style={{ 
          width: boardSize, 
          height: boardSize, 
          gridTemplateColumns: `repeat(${selectedLevel.size}, 1fr)`,
          gridTemplateRows: `repeat(${selectedLevel.size}, 1fr)`
        }}
      >
        {Array.from({ length: selectedLevel.size * selectedLevel.size }).map((_, i) => (
          <div 
            key={i} 
            ref={el => { slotRefs.current[i] = el; }} 
            className="bg-[#0a0a0f] relative w-full h-full border border-white/5"
          >
            {placedPieces.includes(i) && (
              <div 
                className="absolute inset-0 z-0"
                style={{
                  backgroundImage: "url('/puzzle-bg.png')",
                  backgroundSize: `${boardSize}px ${boardSize}px`,
                  backgroundPosition: `-${(i % selectedLevel.size) * pieceSize}px -${Math.floor(i / selectedLevel.size) * pieceSize}px`
                }}
              />
            )}
          </div>
        ))}
      </div>

      {isPlaying && (
        <div 
          className="z-10 mt-6 grid"
          style={{ 
            width: boardSize,
            height: boardSize,
            gridTemplateColumns: `repeat(${selectedLevel.size}, 1fr)`,
            gridTemplateRows: `repeat(${selectedLevel.size}, 1fr)`
          }}
        >
          {shuffledPieces.map((p, index) => {
            if (placedPieces.includes(p)) {
              return <div key={index} className="w-full h-full" />;
            }
            return (
              <div key={index} className="relative w-full h-full bg-[#1a0033]/50 border border-[#b300ff]/20">
                <motion.div
                  drag
                  dragSnapToOrigin
                  onDragStart={() => playTone(300, "triangle", 50)}
                  onDragEnd={(e, info) => handleDragEnd(p, info)}
                  whileDrag={{ scale: 1.1, zIndex: 50, boxShadow: "0 0 20px rgba(179,0,255,0.8)" }}
                  className="absolute inset-0 cursor-grab active:cursor-grabbing border border-transparent hover:border-[#b300ff]/50"
                  style={{
                    backgroundImage: "url('/puzzle-bg.png')",
                    backgroundSize: `${boardSize}px ${boardSize}px`,
                    backgroundPosition: `-${(p % selectedLevel.size) * pieceSize}px -${Math.floor(p / selectedLevel.size) * pieceSize}px`
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {(gameOver || won) && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f]/85 backdrop-blur-[4px]">
          <div className={`text-[22px] font-black tracking-[4px] mb-2 drop-shadow-[0_0_15px_rgba(179,0,255,0.8)] ${won ? 'text-[#00ff80]' : 'text-[#ff3366]'}`}>
            {won ? 'VOCÊ VENCEU!' : 'FIM DO TEMPO'}
          </div>
          <button onClick={reset} className="mt-5 border border-[#b300ff] text-[#b300ff] px-6 py-2 hover:bg-[#b300ff] hover:text-white transition-all text-[11px] tracking-[3px]">
            JOGAR NOVAMENTE
          </button>
        </div>
      )}
      
    </div>
  );
}
