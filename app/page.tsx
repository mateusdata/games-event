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
    const storage = (globalThis as any).localStorage;
    if (storage) {
      const stored = storage.getItem("snake-best");
      if (stored) setBest(Number(stored));
    }
  }, []);

  const updateBestScore = useCallback((newScore: number) => {
    if (newScore > best) {
      setBest(newScore);
      const storage = (globalThis as any).localStorage;
      if (storage) {
        storage.setItem("snake-best", newScore.toString());
      }
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

    const globalWindow = globalThis as any;
    if (globalWindow.addEventListener) {
      globalWindow.addEventListener("keydown", handleKey);
      return () => globalWindow.removeEventListener("keydown", handleKey);
    }
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Courier New', monospace",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
      }} />

      <div style={{
        position: "fixed", top: "30%", left: "50%", transform: "translate(-50%,-50%)",
        width: 600, height: 600, borderRadius: "50%", pointerEvents: "none",
        background: "radial-gradient(circle, rgba(0,255,128,0.04) 0%, transparent 70%)",
      }} />

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          fontSize: 11, letterSpacing: 6, color: "#00ff80", marginBottom: 8,
          textTransform: "uppercase", opacity: 0.7,
        }}>
          Games Eventos
        </div>
        <h1 style={{
          fontSize: "clamp(28px, 6vw, 48px)", fontWeight: 900, margin: 0,
          color: "#fff", letterSpacing: -1, lineHeight: 1,
          textShadow: "0 0 40px rgba(0,255,128,0.3)",
        }}>
          SNAKE
        </h1>
      </div>

      <div style={{
        display: "flex", gap: 32, marginBottom: 20,
        fontSize: 12, letterSpacing: 3, textTransform: "uppercase",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#444", marginBottom: 2 }}>Score</div>
          <div style={{ color: "#00ff80", fontSize: 20, fontWeight: 700 }}>{score}</div>
        </div>
        <div style={{ width: 1, background: "#1a1a2e" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#444", marginBottom: 2 }}>Best</div>
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>{best}</div>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          width: GRID * CELL,
          height: GRID * CELL,
          background: "#0d0d16",
          border: "1px solid #1a1a2e",
          boxShadow: "0 0 60px rgba(0,255,128,0.08), inset 0 0 40px rgba(0,0,0,0.5)",
          cursor: "pointer",
        }}
        onClick={() => { if (!started && !dead) reset(); if (dead) reset(); }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {Array.from({ length: GRID }).map((_, i) => (
          <div key={`h${i}`} style={{
            position: "absolute", left: 0, right: 0, top: i * CELL, height: 1,
            background: "rgba(255,255,255,0.02)",
          }} />
        ))}
        {Array.from({ length: GRID }).map((_, i) => (
          <div key={`v${i}`} style={{
            position: "absolute", top: 0, bottom: 0, left: i * CELL, width: 1,
            background: "rgba(255,255,255,0.02)",
          }} />
        ))}

        {snake.map((seg, i) => (
          <div key={i} style={{
            position: "absolute",
            left: seg.x * CELL + 1,
            top: seg.y * CELL + 1,
            width: CELL - 2,
            height: CELL - 2,
            background: i === 0
              ? "#00ff80"
              : `rgba(0,255,128,${Math.max(0.15, 1 - i * 0.04)})`,
            borderRadius: i === 0 ? 4 : 2,
            boxShadow: i === 0 ? "0 0 12px rgba(0,255,128,0.8)" : "none",
            transition: "none",
          }} />
        ))}

        <div style={{
          position: "absolute",
          left: food.x * CELL + 2,
          top: food.y * CELL + 2,
          width: CELL - 4,
          height: CELL - 4,
          background: "#ff3366",
          borderRadius: "50%",
          boxShadow: "0 0 10px rgba(255,51,102,0.8)",
          animation: "pulse 1s ease-in-out infinite",
        }} />

        {!started && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "rgba(10,10,15,0.85)", backdropFilter: "blur(2px)",
          }}>
            {dead ? (
              <>
                <div style={{ color: "#ff3366", fontSize: 22, fontWeight: 900, letterSpacing: 4, marginBottom: 8 }}>
                  GAME OVER
                </div>
                <div style={{ color: "#444", fontSize: 11, letterSpacing: 3 }}>
                  SCORE: <span style={{ color: "#fff" }}>{score}</span>
                </div>
                <div style={{ marginTop: 20, color: "#00ff80", fontSize: 11, letterSpacing: 3, animation: "blink 1s step-end infinite" }}>
                  CLIQUE PARA JOGAR
                </div>
              </>
            ) : (
              <>
                <div style={{ color: "#00ff80", fontSize: 13, letterSpacing: 4, marginBottom: 6 }}>
                  PRONTO?
                </div>
                <div style={{ color: "#333", fontSize: 11, letterSpacing: 2, marginBottom: 20 }}>
                  WASD / SETAS / SWIPE
                </div>
                <div style={{ color: "#00ff80", fontSize: 11, letterSpacing: 3, animation: "blink 1s step-end infinite" }}>
                  CLIQUE PARA INICIAR
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{
        marginTop: 20, color: "#222", fontSize: 10, letterSpacing: 3,
        textTransform: "uppercase",
      }}>
        ← WASD ou SETAS →
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.85); opacity: 0.7; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}