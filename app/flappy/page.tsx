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

const GRAVITY = 0.4;
const FLAP_STRENGTH = -7;
const PIPE_SPEED = 3;
const PIPE_SPAWN_RATE = 100;
const PIPE_GAP = 220;
const BIRD_SIZE = 30;
const PIPE_WIDTH = 60;

export default function FlappyGame() {
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "GAMEOVER">("IDLE");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const birdY = useRef(300);
  const birdVelocity = useRef(0);
  const pipes = useRef<{ x: number; topHeight: number; passed: boolean }[]>([]);
  const frameCount = useRef(0);
  const reqId = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [, setRenderTrigger] = useState(0);

  useEffect(() => {
    const saved = (globalThis as any).localStorage?.getItem("flappyHighScore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const flap = useCallback(() => {
    if (gameState === "IDLE") {
      setGameState("PLAYING");
      birdY.current = 300;
      birdVelocity.current = FLAP_STRENGTH;
      pipes.current = [];
      setScore(0);
      frameCount.current = 0;
      playTone(600, "square", 100);
    } else if (gameState === "PLAYING") {
      birdVelocity.current = FLAP_STRENGTH;
      playTone(600, "square", 100);
    } else if (gameState === "GAMEOVER") {
      setGameState("IDLE");
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (e.code === "Space") {
        e.preventDefault();
        flap();
      }
    };
    (globalThis as any).addEventListener("keydown", handleKeyDown);
    return () => (globalThis as any).removeEventListener("keydown", handleKeyDown);
  }, [flap]);

  useEffect(() => {
    if (gameState !== "PLAYING") return;

    const gameLoop = () => {
      if (!containerRef.current) return;
      const height = (containerRef.current as any).clientHeight;
      const width = (containerRef.current as any).clientWidth;

      birdVelocity.current += GRAVITY;
      birdY.current += birdVelocity.current;

      if (birdY.current < 0) {
        birdY.current = 0;
        birdVelocity.current = 0;
      }
      if (birdY.current + BIRD_SIZE > height) {
        endGame();
        return;
      }

      frameCount.current += 1;
      if (frameCount.current % PIPE_SPAWN_RATE === 0) {
        const topHeight = Math.max(50, Math.random() * (height - PIPE_GAP - 100));
        pipes.current.push({ x: width, topHeight, passed: false });
      }

      for (let i = 0; i < pipes.current.length; i++) {
        const p = pipes.current[i];
        p.x -= PIPE_SPEED;

        if (!p.passed && p.x + PIPE_WIDTH < 100) {
          p.passed = true;
          setScore((s) => {
            const newScore = s + 1;
            playTone(800 + newScore * 50, "sine", 150);
            return newScore;
          });
        }

        const birdRect = { left: 100, right: 100 + BIRD_SIZE, top: birdY.current, bottom: birdY.current + BIRD_SIZE };
        const pipeTopRect = { left: p.x, right: p.x + PIPE_WIDTH, top: 0, bottom: p.topHeight };
        const pipeBottomRect = { left: p.x, right: p.x + PIPE_WIDTH, top: p.topHeight + PIPE_GAP, bottom: height };

        if (
          birdRect.right > pipeTopRect.left && birdRect.left < pipeTopRect.right && birdRect.top < pipeTopRect.bottom ||
          birdRect.right > pipeBottomRect.left && birdRect.left < pipeBottomRect.right && birdRect.bottom > pipeBottomRect.top
        ) {
          endGame();
          return;
        }
      }

      pipes.current = pipes.current.filter((p) => p.x + PIPE_WIDTH > 0);

      setRenderTrigger((prev) => prev + 1);
      reqId.current = (globalThis as any).requestAnimationFrame(gameLoop);
    };

    reqId.current = (globalThis as any).requestAnimationFrame(gameLoop);
    return () => (globalThis as any).cancelAnimationFrame(reqId.current);
  }, [gameState]);

  const endGame = () => {
    setGameState("GAMEOVER");
    playTone(150, "sawtooth", 500);
    setScore((currentScore) => {
      setHighScore((prev) => {
        const best = Math.max(prev, currentScore);
        (globalThis as any).localStorage?.setItem("flappyHighScore", best.toString());
        return best;
      });
      return currentScore;
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center font-mono p-5 relative overflow-hidden select-none" onClick={flap}>
      <div className="fixed inset-0 pointer-events-none z-10 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.08)_2px,rgba(0,0,0,0.08)_4px)]" />

      <div className="text-center mb-6 z-10">
        <h1 className="text-[clamp(28px,6vw,48px)] font-black m-0 text-white tracking-tighter leading-none drop-shadow-[0_0_40px_rgba(0,255,255,0.3)]">
          FLAPPY NEON
        </h1>
      </div>

      <div className="flex gap-8 mb-5 z-10 text-xs tracking-[3px] uppercase">
        <div className="text-center">
          <div className="text-[#555] mb-1">SCORE</div>
          <div className="text-2xl font-bold text-[#00ffff] drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-[#555] mb-1">BEST</div>
          <div className="text-2xl font-bold text-[#fff]">{highScore}</div>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full max-w-[500px] h-[600px] bg-[#0d0d16] border border-[#1a1a2e] shadow-[0_0_60px_rgba(0,255,255,0.08),inset_0_0_40px_rgba(0,0,0,0.5)] rounded-2xl z-10 overflow-hidden cursor-pointer"
      >
        {gameState === "IDLE" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f]/80 z-20">
            <div className="text-[#00ffff] text-xl font-bold tracking-[4px] animate-pulse">TOQUE PARA COMEÇAR</div>
          </div>
        )}

        {gameState === "GAMEOVER" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#ff0033]/20 backdrop-blur-[2px] z-20">
            <div className="text-white text-3xl font-bold tracking-[4px] mb-4">GAME OVER</div>
            <div className="text-[#00ffff] text-sm tracking-[2px] animate-pulse">TOQUE PARA TENTAR DE NOVO</div>
          </div>
        )}

        <div 
          className="absolute left-[100px] bg-[#00ffff] shadow-[0_0_20px_#00ffff]"
          style={{ 
            top: birdY.current, 
            width: BIRD_SIZE, 
            height: BIRD_SIZE, 
            borderRadius: '4px',
            transform: `rotate(${Math.min(Math.max(birdVelocity.current * 4, -45), 90)}deg)`,
            transition: 'transform 0.1s'
          }}
        />

        {pipes.current.map((p, i) => (
          <div key={i}>
            <div 
              className="absolute bg-[#ff00ff] shadow-[0_0_15px_#ff00ff] border-b-4 border-[#fff]"
              style={{ left: p.x, top: 0, width: PIPE_WIDTH, height: p.topHeight }}
            />
            <div 
              className="absolute bg-[#ff00ff] shadow-[0_0_15px_#ff00ff] border-t-4 border-[#fff]"
              style={{ left: p.x, top: p.topHeight + PIPE_GAP, width: PIPE_WIDTH, bottom: 0 }}
            />
          </div>
        ))}
      </div>


    </div>
  );
}
