"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Matter from "matter-js";

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

export default function DropGame() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);

  const [score, setScore] = useState(0);
  const [coinsLeft, setCoinsLeft] = useState(20);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const WIDTH = 600;
  const HEIGHT = 700;
  const MULTIPLIERS = [10, 5, 2, 1, 0, 1, 2, 5, 10];
  const BUCKET_WIDTH = WIDTH / MULTIPLIERS.length;

  const initGame = useCallback(() => {
    if (!sceneRef.current) return;

    if (renderRef.current) {
      Matter.Render.stop(renderRef.current);
      if (engineRef.current) Matter.Engine.clear(engineRef.current);
      if (renderRef.current.canvas) (renderRef.current.canvas as any).remove();
      renderRef.current = null;
    }
    if (runnerRef.current) {
      Matter.Runner.stop(runnerRef.current);
    }

    setScore(0);
    setCoinsLeft(20);
    setGameOver(false);

    const engine = Matter.Engine.create();
    engine.gravity.y = 1;
    engineRef.current = engine;

    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: WIDTH,
        height: HEIGHT,
        wireframes: false,
        background: "transparent",
      },
    });
    renderRef.current = render;

    const runner = Matter.Runner.create();
    runnerRef.current = runner;

    Matter.Render.run(render);
    Matter.Runner.run(runner, engine);

    const bodies: Matter.Body[] = [];

    bodies.push(
      Matter.Bodies.rectangle(WIDTH / 2, HEIGHT + 25, WIDTH, 50, { isStatic: true, render: { visible: false } }),
      Matter.Bodies.rectangle(-25, HEIGHT / 2, 50, HEIGHT, { isStatic: true, render: { visible: false } }),
      Matter.Bodies.rectangle(WIDTH + 25, HEIGHT / 2, 50, HEIGHT, { isStatic: true, render: { visible: false } })
    );

    const rows = 12;
    const cols = 9;
    const spacingX = WIDTH / cols;
    const spacingY = (HEIGHT - 200) / rows;

    for (let r = 0; r < rows; r++) {
      const numCols = r % 2 === 0 ? cols : cols - 1;
      const offsetX = r % 2 === 0 ? spacingX / 2 : spacingX;
      for (let c = 0; c < numCols; c++) {
        const x = offsetX + c * spacingX;
        const y = 100 + r * spacingY;
        bodies.push(
          Matter.Bodies.circle(x, y, 4, {
            isStatic: true,
            restitution: 0.5,
            friction: 0.1,
            render: {
              fillStyle: "#1a1a2e",
              strokeStyle: "#00ccff",
              lineWidth: 1
            }
          })
        );
      }
    }

    for (let i = 0; i <= MULTIPLIERS.length; i++) {
      const x = i * BUCKET_WIDTH;
      bodies.push(
        Matter.Bodies.rectangle(x, HEIGHT - 40, 4, 80, {
          isStatic: true,
          render: { fillStyle: "#1a1a2e" }
        })
      );
    }

    const sensors: Matter.Body[] = [];
    MULTIPLIERS.forEach((mult, i) => {
      const x = i * BUCKET_WIDTH + BUCKET_WIDTH / 2;
      const sensor = Matter.Bodies.rectangle(x, HEIGHT - 10, BUCKET_WIDTH - 10, 20, {
        isStatic: true,
        isSensor: true,
        label: `bucket-${mult}`,
        render: { visible: false }
      });
      sensors.push(sensor);
    });

    bodies.push(...sensors);
    Matter.Composite.add(engine.world, bodies);

    let checkInterval: NodeJS.Timeout;

    Matter.Events.on(engine, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        if ((bodyA.label === "coin" && !bodyB.isSensor) || (bodyB.label === "coin" && !bodyA.isSensor)) {
          playTone(400 + Math.random() * 200, "triangle", 20);
        }

        const coin = bodyA.label === "coin" ? bodyA : (bodyB.label === "coin" ? bodyB : null);
        const sensor = bodyA.isSensor ? bodyA : (bodyB.isSensor ? bodyB : null);

        if (coin && sensor && sensor.label.startsWith("bucket-")) {
          const mult = parseInt(sensor.label.split("-")[1], 10);

          if (mult > 2) playTone(800, "square", 300);
          else if (mult > 0) playTone(500, "square", 200);
          else playTone(200, "sawtooth", 300);

          setScore(s => s + mult * 10);
          Matter.Composite.remove(engine.world, coin);
        }
      });
    });

    checkInterval = setInterval(() => {
      setCoinsLeft((currentCoins) => {
        if (currentCoins <= 0) {
          const remaining = engine.world.bodies.filter(b => b.label === "coin");
          if (remaining.length === 0) {
            setGameOver(true);
            clearInterval(checkInterval);
          }
        }
        return currentCoins;
      });
    }, 500);

    return () => clearInterval(checkInterval);
  }, []);

  useEffect(() => {
    const cleanup = initGame();
    return () => {
      if (cleanup) cleanup();
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
        if (renderRef.current.canvas) (renderRef.current.canvas as any).remove();
      }
      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current);
      }
      if (engineRef.current) {
        Matter.Engine.clear(engineRef.current);
      }
    };
  }, [initGame]);

  const dropCoin = (x: number) => {
    if (coinsLeft <= 0 || !engineRef.current || gameOver) return;

    playTone(600, "sine", 100);
    setCoinsLeft(prev => prev - 1);

    const dropX = x + (Math.random() * 4 - 2);

    const coin = Matter.Bodies.circle(dropX, 10, 8, {
      label: "coin",
      restitution: 0.6,
      friction: 0.05,
      density: 0.04,
      render: {
        fillStyle: "#00ff80",
        strokeStyle: "#fff",
        lineWidth: 1
      }
    });

    Matter.Composite.add(engineRef.current.world, coin);
  };

  const handleSceneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameOver || coinsLeft <= 0 || !gameStarted) return;
    const rect = (sceneRef.current as any)?.getBoundingClientRect();
    if (rect) {
      const scale = WIDTH / rect.width;
      const x = (e.clientX - rect.left) * scale;
      dropCoin(x);
    }
  };

  const startGame = () => {
    playTone(300, "square", 200);
    setGameStarted(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center font-mono p-5 relative overflow-hidden select-none">

      <div className="fixed inset-0 pointer-events-none z-10 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.08)_2px,rgba(0,0,0,0.08)_4px)]" />

      <div className="fixed top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(0,204,255,0.04)_0%,transparent_70%)]" />

      <div className="text-center mb-4 sm:mb-8 z-10 mt-10 sm:mt-0">
        <div className="text-[11px] tracking-[6px] text-[#00ccff] mb-2 uppercase opacity-70">
          Games Eventos
        </div>
        <h1 className="text-[clamp(28px,6vw,48px)] font-black m-0 text-white tracking-tighter leading-none drop-shadow-[0_0_40px_rgba(0,204,255,0.3)]">
          DROP COIN
        </h1>
      </div>

      <div className="flex gap-8 mb-5 z-10 text-xs tracking-[3px] uppercase">
        <div className="text-center">
          <div className="text-[#444] mb-0.5">Score</div>
          <div className="text-[#00ccff] text-xl font-bold">{score}</div>
        </div>
        <div className="w-px bg-[#1a1a2e]" />
        <div className="text-center">
          <div className="text-[#444] mb-0.5">Coins</div>
          <div className="text-[#ffcc00] text-xl font-bold">{coinsLeft}</div>
        </div>
      </div>

      <div
        className="relative bg-[#0d0d16] border border-[#1a1a2e] shadow-[0_0_60px_rgba(0,204,255,0.08),inset_0_0_40px_rgba(0,0,0,0.5)] rounded-2xl z-10 overflow-hidden cursor-crosshair mx-auto"
        style={{ width: "100%", maxWidth: "min(600px, calc(65vh * 6 / 7))" }}
      >

        <div
          ref={sceneRef}
          onClick={handleSceneClick}
          style={{ width: "100%", aspectRatio: '6/7' }}
          className="[&>canvas]:!w-full [&>canvas]:!h-full [&>canvas]:block"
        />

        <div className="absolute bottom-0 left-0 w-full flex text-white pointer-events-none text-center h-[40px] items-center justify-between">
          {MULTIPLIERS.map((m, i) => (
            <div
              key={i}
              style={{ width: `${100 / MULTIPLIERS.length}%` }}
              className={`text-[10px] sm:text-xs font-bold ${m > 2 ? 'text-[#ff3366]' : m > 0 ? 'text-[#00ff80]' : 'text-[#555]'}`}
            >
              {m}x
            </div>
          ))}
        </div>

        {!gameStarted && (
          <div
            onClick={startGame}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f]/85 backdrop-blur-[4px] cursor-pointer"
          >
            <div className="text-[#00ccff] text-[13px] tracking-[4px] mb-1.5">
              PLINKO STYLE
            </div>
            <div className="text-[#333] text-[11px] tracking-[2px] mb-5">
              CLIQUE NO TOPO PARA SOLTAR
            </div>
            <div className="text-[#00ff80] text-[11px] tracking-[3px] animate-[blink_1s_step-end_infinite]">
              CLIQUE PARA INICIAR
            </div>
          </div>
        )}

        {gameOver && gameStarted && (
          <div
            onClick={() => { initGame(); startGame(); }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f]/85 backdrop-blur-[4px] cursor-pointer"
          >
            <div className="text-[#00ccff] text-[22px] font-black tracking-[4px] mb-2 drop-shadow-[0_0_15px_rgba(0,204,255,0.8)]">
              FIM DE JOGO
            </div>
            <div className="text-[#444] text-[11px] tracking-[3px]">
              FINAL SCORE: <span className="text-white">{score}</span>
            </div>
            <div className="mt-5 text-[#00ff80] text-[11px] tracking-[3px] animate-[blink_1s_step-end_infinite]">
              CLIQUE PARA RECOMEÇAR
            </div>
          </div>
        )}

      </div>

      <div className="mt-5 text-[#222] text-[10px] tracking-[3px] uppercase z-10 text-center">
        Clique na área superior para jogar a moeda
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
