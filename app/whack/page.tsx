"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

function playTone(freq: number, type: string, durationMs: number) {
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

const GAME_DURATION = 30;
const GRID_SIZE = 9;

export default function WhackGame() {
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "GAMEOVER">("IDLE");
  const isPlayingRef = useRef(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [activeBugIndex, setActiveBugIndex] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const bugTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = (globalThis as any).localStorage?.getItem("whackHighScore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const spawnBug = useCallback(() => {
    if (!isPlayingRef.current) return;
    const randomPos = Math.floor(Math.random() * GRID_SIZE);
    setActiveBugIndex(randomPos);

    const bugDuration = Math.max(500, 1500 - score * 20);
    
    if (bugTimerRef.current) clearTimeout(bugTimerRef.current);
    bugTimerRef.current = setTimeout(() => {
      if (isPlayingRef.current) {
        setActiveBugIndex(null);
        spawnBug();
      }
    }, bugDuration);
  }, [score]);

  const startGame = () => {
    setGameState("PLAYING");
    isPlayingRef.current = true;
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setActiveBugIndex(null);
    playTone(400, "square", 300);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(spawnBug, 500);
  };

  const endGame = () => {
    setGameState("GAMEOVER");
    isPlayingRef.current = false;
    setActiveBugIndex(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (bugTimerRef.current) clearTimeout(bugTimerRef.current);
    
    playTone(150, "sawtooth", 500);
    setTimeout(() => playTone(100, "sawtooth", 800), 200);

    setScore((currentScore) => {
      setHighScore((prev) => {
        const best = Math.max(prev, currentScore);
        (globalThis as any).localStorage?.setItem("whackHighScore", best.toString());
        return best;
      });
      return currentScore;
    });
  };

  const hitBug = (index: number) => {
    if (gameState !== "PLAYING") return;

    if (index === activeBugIndex) {
      setScore((s) => s + 1);
      playTone(1000, "sine", 100);
      setActiveBugIndex(null);
      if (bugTimerRef.current) clearTimeout(bugTimerRef.current);
      setTimeout(spawnBug, 100);
    } else {
      playTone(200, "triangle", 150);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (bugTimerRef.current) clearTimeout(bugTimerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center font-mono p-5 relative overflow-hidden select-none">
      <div className="fixed inset-0 pointer-events-none z-10 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.08)_2px,rgba(0,0,0,0.08)_4px)]" />

      <div className="text-center mb-6 z-10">
        <h1 className="text-[clamp(28px,6vw,48px)] font-black m-0 text-white tracking-tighter leading-none drop-shadow-[0_0_40px_rgba(255,0,255,0.3)]">
          WHACK-A-BUG
        </h1>
      </div>

      <div className="flex gap-8 mb-5 z-10 text-xs tracking-[3px] uppercase">
        <div className="text-center">
          <div className="text-[#555] mb-1">SCORE</div>
          <div className="text-2xl font-bold text-[#ff00ff] drop-shadow-[0_0_10px_rgba(255,0,255,0.5)]">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-[#555] mb-1">TIME</div>
          <div className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-[#ff3366] animate-pulse' : 'text-white'}`}>{timeLeft}s</div>
        </div>
        <div className="text-center">
          <div className="text-[#555] mb-1">BEST</div>
          <div className="text-2xl font-bold text-[#fff]">{highScore}</div>
        </div>
      </div>

      <div className="relative w-full max-w-[400px] aspect-square bg-[#0d0d16] border border-[#1a1a2e] shadow-[0_0_60px_rgba(255,0,255,0.08),inset_0_0_40px_rgba(0,0,0,0.5)] rounded-2xl z-10 p-4">
        
        {gameState === "IDLE" && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f]/90 z-20 cursor-pointer rounded-2xl"
            onClick={startGame}
          >
            <div className="text-[#ff00ff] text-xl font-bold tracking-[4px] animate-pulse text-center px-4">
              TOQUE PARA COMEÇAR
            </div>
            <div className="mt-4 text-[#555] text-xs tracking-[2px]">
              ESMAGUE OS BUGS ANTES QUE SUMAM
            </div>
          </div>
        )}

        {gameState === "GAMEOVER" && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#ff0033]/20 backdrop-blur-[2px] z-20 cursor-pointer rounded-2xl"
            onClick={startGame}
          >
            <div className="text-white text-3xl font-bold tracking-[4px] mb-4">GAME OVER</div>
            <div className="text-[#ff00ff] text-sm tracking-[2px] animate-pulse">TOQUE PARA TENTAR DE NOVO</div>
          </div>
        )}

        <div className="grid grid-cols-3 grid-rows-3 gap-4 w-full h-full">
          {Array.from({ length: GRID_SIZE }).map((_, i) => (
            <div 
              key={i}
              onPointerDown={() => hitBug(i)}
              className="relative rounded-full bg-[#050508] border-2 border-[#1a1a2e] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-hidden cursor-crosshair flex items-center justify-center"
            >
              {activeBugIndex === i && (
                <div className="w-[60%] h-[60%] bg-[#ff00ff] rounded-full shadow-[0_0_30px_#ff00ff] animate-bounce" />
              )}
            </div>
          ))}
        </div>

      </div>


    </div>
  );
}
