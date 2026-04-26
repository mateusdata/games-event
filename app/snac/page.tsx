"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Point = { x: number; y: number };

const GRID = 20;
const CELL = 20;
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }];
const INITIAL_DIR: Point = { x: 1, y: 0 };
const SPEED = 120;

function randomFood(snake: Point[]): Point {
  let pos: Point;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

export default function SnakeGame() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [dir, setDir] = useState<Point>(INITIAL_DIR);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState<number>(0);
  const [best, setBest] = useState<number>(0);
  const [dead, setDead] = useState<boolean>(false);
  const [started, setStarted] = useState<boolean>(false);

  const dirRef = useRef<Point>(INITIAL_DIR);
  const snakeRef = useRef<Point[]>(INITIAL_SNAKE);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const swipe = useRef<Point | null>(null);

  useEffect(() => {
    const stored = (globalThis as any).localStorage?.getItem("snake-best");
    if (stored) setBest(Number(stored));
  }, []);

  const updateBestScore = useCallback((newScore: number) => {
    if (newScore > best) {
      setBest(newScore);
      (globalThis as any).localStorage?.setItem("snake-best", newScore.toString());
    }
  }, [best]);

  const reset = useCallback(() => {
    const s: Point[] = [{ x: 10, y: 10 }];
    const d: Point = { x: 1, y: 0 };
    snakeRef.current = s;
    dirRef.current = d;
    setSnake(s);
    setDir(d);
    setFood(randomFood(s));
    setScore(0);
    setDead(false);
    setStarted(true);
  }, []);

  useEffect(() => {
    const handleKey = (e: any) => {
      const map: Record<string, Point> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };
      const next = map[e.key];
      if (!next) return;
      const cur = dirRef.current;
      if (next.x === -cur.x && next.y === -cur.y) return;
      dirRef.current = next;
      setDir(next);
      if (!started && !dead) reset();
    };

    (globalThis as any).addEventListener("keydown", handleKey);
    return () => (globalThis as any).removeEventListener("keydown", handleKey);
  }, [started, dead, reset]);

  useEffect(() => {
    if (!started || dead) return;
    intervalRef.current = setInterval(() => {
      const d = dirRef.current;
      const s = snakeRef.current;
      const head: Point = { x: s[0].x + d.x, y: s[0].y + d.y };
      if (
        head.x < 0 || head.x >= GRID ||
        head.y < 0 || head.y >= GRID ||
        s.some((seg) => seg.x === head.x && seg.y === head.y)
      ) {
        setDead(true);
        setStarted(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      setFood((f) => {
        const ate = head.x === f.x && head.y === f.y;
        let newSnake: Point[];
        if (ate) {
          newSnake = [head, ...s];
          setScore((sc) => {
            const ns = sc + 10;
            updateBestScore(ns);
            return ns;
          });
          snakeRef.current = newSnake;
          setSnake(newSnake);
          return randomFood(newSnake);
        } else {
          newSnake = [head, ...s.slice(0, -1)];
          snakeRef.current = newSnake;
          setSnake(newSnake);
          return f;
        }
      });
    }, SPEED);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started, dead, updateBestScore]);

  const handleTouchStart = (e: React.TouchEvent<any>) => {
    swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<any>) => {
    if (!swipe.current) return;
    const dx = e.changedTouches[0].clientX - swipe.current.x;
    const dy = e.changedTouches[0].clientY - swipe.current.y;
    const cur = dirRef.current;
    let next = cur;
    if (Math.abs(dx) > Math.abs(dy)) {
      next = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    } else {
      next = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    }
    if (next.x !== -cur.x || next.y !== -cur.y) {
      dirRef.current = next;
      setDir(next);
    }
    if (!started) reset();
    swipe.current = null;
  };

  const boardSize = GRID * CELL;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center font-mono px-5 relative overflow-hidden">

      {/* scanline */}
      <div className="fixed inset-0 pointer-events-none z-10 [background-image:repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.08)_2px,rgba(0,0,0,0.08)_4px)]" />

      {/* glow */}
      <div className="fixed top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none [background:radial-gradient(circle,rgba(0,255,128,0.04)_0%,transparent_70%)]" />

      {/* header */}
      <div className="text-center mb-8">
        <p className="text-[11px] tracking-[6px] text-[#00ff80] mb-2 uppercase opacity-70">
          Games Eventos
        </p>
        <h1 className="text-[clamp(28px,6vw,48px)] font-black text-white tracking-tight leading-none [text-shadow:0_0_40px_rgba(0,255,128,0.3)]">
          SNAKE
        </h1>
      </div>

      {/* score */}
      <div className="flex gap-8 mb-5 text-xs tracking-[3px] uppercase">
        <div className="text-center">
          <p className="text-[#444] mb-0.5">Score</p>
          <p className="text-[#00ff80] text-xl font-bold">{score}</p>
        </div>
        <div className="w-px bg-[#1a1a2e]" />
        <div className="text-center">
          <p className="text-[#444] mb-0.5">Best</p>
          <p className="text-white text-xl font-bold">{best}</p>
        </div>
      </div>

      {/* board */}
      <div
        className="relative cursor-pointer bg-[#0d0d16] border border-[#1a1a2e] [box-shadow:0_0_60px_rgba(0,255,128,0.08),inset_0_0_40px_rgba(0,0,0,0.5)]"
        style={{ width: boardSize, height: boardSize }}
        onClick={() => { if (!started && !dead) reset(); if (dead) reset(); }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {Array.from({ length: GRID }).map((_, i) => (
          <div key={`h${i}`} className="absolute left-0 right-0 h-px bg-white/[0.02]" style={{ top: i * CELL }} />
        ))}
        {Array.from({ length: GRID }).map((_, i) => (
          <div key={`v${i}`} className="absolute top-0 bottom-0 w-px bg-white/[0.02]" style={{ left: i * CELL }} />
        ))}

        {snake.map((seg, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: seg.x * CELL + 1,
              top: seg.y * CELL + 1,
              width: CELL - 2,
              height: CELL - 2,
              background: i === 0 ? "#00ff80" : `rgba(0,255,128,${Math.max(0.15, 1 - i * 0.04)})`,
              borderRadius: i === 0 ? 4 : 2,
              boxShadow: i === 0 ? "0 0 12px rgba(0,255,128,0.8)" : "none",
              transition: "none",
            }}
          />
        ))}

        <div
          className="absolute rounded-full animate-pulse"
          style={{
            left: food.x * CELL + 2,
            top: food.y * CELL + 2,
            width: CELL - 4,
            height: CELL - 4,
            background: "#ff3366",
            boxShadow: "0 0 10px rgba(255,51,102,0.8)",
          }}
        />

        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(10,10,15,0.85)] backdrop-blur-sm">
            {dead ? (
              <>
                <p className="text-[#ff3366] text-[22px] font-black tracking-[4px] mb-2">GAME OVER</p>
                <p className="text-[#444] text-[11px] tracking-[3px]">
                  SCORE: <span className="text-white">{score}</span>
                </p>
                <p className="mt-5 text-[#00ff80] text-[11px] tracking-[3px] animate-[blink_1s_step-end_infinite]">
                  CLIQUE PARA JOGAR
                </p>
              </>
            ) : (
              <>
                <p className="text-[#00ff80] text-[13px] tracking-[4px] mb-1.5">PRONTO?</p>
                <p className="text-[#333] text-[11px] tracking-[2px] mb-5">WASD / SETAS / SWIPE</p>
                <p className="text-[#00ff80] text-[11px] tracking-[3px] animate-[blink_1s_step-end_infinite]">
                  CLIQUE PARA INICIAR
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <p className="mt-5 text-[#222] text-[10px] tracking-[3px] uppercase">← WASD ou SETAS →</p>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}