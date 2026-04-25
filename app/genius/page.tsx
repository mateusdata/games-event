"use client";

import { useEffect, useState, useCallback } from "react";

type PadColor = {
  id: number;
  baseColor: string;
  glowColor: string;
  freq: number;
};

const PADS: PadColor[] = [
  { id: 0, baseColor: "rgba(0, 255, 128, 0.3)", glowColor: "#00ff80", freq: 329.63 },
  { id: 1, baseColor: "rgba(255, 51, 102, 0.3)", glowColor: "#ff3366", freq: 261.63 },
  { id: 2, baseColor: "rgba(255, 204, 0, 0.3)", glowColor: "#ffcc00", freq: 220.00 },
  { id: 3, baseColor: "rgba(0, 204, 255, 0.3)", glowColor: "#00ccff", freq: 164.81 },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

export default function GeniusGame() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerStep, setPlayerStep] = useState<number>(0);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [isPlayingSeq, setIsPlayingSeq] = useState<boolean>(false);
  
  const [score, setScore] = useState<number>(0);
  const [best, setBest] = useState<number>(0);
  const [dead, setDead] = useState<boolean>(false);
  const [started, setStarted] = useState<boolean>(false);

  useEffect(() => {
    const stored = (globalThis as any).localStorage?.getItem("genius-best");
    if (stored) setBest(Number(stored));
  }, []);

  const updateBestScore = useCallback((newScore: number) => {
    if (newScore > best) {
      setBest(newScore);
      (globalThis as any).localStorage?.setItem("genius-best", newScore.toString());
    }
  }, [best]);

  const playSequence = async (seq: number[]) => {
    setIsPlayingSeq(true);
    await sleep(600);
    
    for (let i = 0; i < seq.length; i++) {
      const padId = seq[i];
      const pad = PADS.find(p => p.id === padId);
      
      setActivePad(padId);
      if (pad) playTone(pad.freq, "square", 400);
      
      await sleep(400);
      setActivePad(null);
      await sleep(200);
    }
    
    setIsPlayingSeq(false);
  };

  const startNextLevel = useCallback((currentSeq: number[]) => {
    const nextPad = Math.floor(Math.random() * 4);
    const newSeq = [...currentSeq, nextPad];
    setSequence(newSeq);
    setPlayerStep(0);
    playSequence(newSeq);
  }, []);

  const reset = useCallback(() => {
    setScore(0);
    setDead(false);
    setStarted(true);
    startNextLevel([]);
  }, [startNextLevel]);

  const handlePadClick = async (id: number) => {
    if (!started || dead || isPlayingSeq) return;

    setActivePad(id);
    const pad = PADS.find(p => p.id === id);
    if (pad) playTone(pad.freq, "square", 200);
    
    setTimeout(() => {
      if (!isPlayingSeq) setActivePad(null);
    }, 200);

    if (id === sequence[playerStep]) {
      const nextStep = playerStep + 1;
      setPlayerStep(nextStep);

      if (nextStep === sequence.length) {
        const newScore = score + 1;
        setScore(newScore);
        updateBestScore(newScore);
        setIsPlayingSeq(true);
        
        setTimeout(() => {
          startNextLevel(sequence);
        }, 1000);
      }
    } else {
      playTone(100, "sawtooth", 800);
      setDead(true);
      setStarted(false);
      setSequence([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center font-mono p-5 relative overflow-hidden">
      
      <div className="fixed inset-0 pointer-events-none z-10 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.08)_2px,rgba(0,0,0,0.08)_4px)]" />

      <div className="fixed top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(0,255,128,0.04)_0%,transparent_70%)]" />

      <div className="text-center mb-8 z-10">
        <div className="text-[11px] tracking-[6px] text-[#00ff80] mb-2 uppercase opacity-70">
          Games Eventos
        </div>
        <h1 className="text-[clamp(28px,6vw,48px)] font-black m-0 text-white tracking-tighter leading-none drop-shadow-[0_0_40px_rgba(0,255,128,0.3)]">
          GENIUS
        </h1>
      </div>

      <div className="flex gap-8 mb-5 z-10 text-xs tracking-[3px] uppercase">
        <div className="text-center">
          <div className="text-[#444] mb-0.5">Level</div>
          <div className="text-[#00ff80] text-xl font-bold">{score}</div>
        </div>
        <div className="w-px bg-[#1a1a2e]" />
        <div className="text-center">
          <div className="text-[#444] mb-0.5">Best</div>
          <div className="text-white text-xl font-bold">{best}</div>
        </div>
      </div>

      <div className="relative w-full max-w-[400px] aspect-square bg-[#0d0d16] border border-[#1a1a2e] shadow-[0_0_60px_rgba(0,255,128,0.08),inset_0_0_40px_rgba(0,0,0,0.5)] grid grid-cols-2 grid-rows-2 gap-3 p-3 rounded-[24px] z-10">
        {PADS.map((pad) => {
          const isActive = activePad === pad.id;
          return (
            <button
              key={pad.id}
              onClick={() => handlePadClick(pad.id)}
              disabled={isPlayingSeq || (!started && !dead)}
              className={`rounded-xl transition-all duration-100 outline-none border ${
                isPlayingSeq || !started ? "cursor-default" : "cursor-pointer"
              }`}
              style={{
                background: isActive ? pad.glowColor : pad.baseColor,
                borderColor: isActive ? "#fff" : "rgba(255,255,255,0.05)",
                boxShadow: isActive ? `0 0 40px ${pad.glowColor}` : "none",
              }}
            />
          );
        })}

        {!started && (
          <div 
            onClick={() => { if (!started) reset(); }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f]/85 backdrop-blur-[4px] rounded-[24px] cursor-pointer"
          >
            {dead ? (
              <>
                <div className="text-[#ff3366] text-[22px] font-black tracking-[4px] mb-2">
                  GAME OVER
                </div>
                <div className="text-[#444] text-[11px] tracking-[3px]">
                  LEVEL ALCANÇADO: <span className="text-white">{score}</span>
                </div>
                <div className="mt-5 text-[#00ff80] text-[11px] tracking-[3px] retro-blink">
                  CLIQUE PARA TENTAR DE NOVO
                </div>
              </>
            ) : (
              <>
                <div className="text-[#00ff80] text-[13px] tracking-[4px] mb-1.5">
                  ATENÇÃO
                </div>
                <div className="text-[#333] text-[11px] tracking-[2px] mb-5">
                  REPITA A SEQUÊNCIA DE CORES
                </div>
                <div className="text-[#00ff80] text-[11px] tracking-[3px] retro-blink">
                  CLIQUE PARA INICIAR
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 text-[#222] text-[10px] tracking-[3px] uppercase z-10">
        {isPlayingSeq ? "MEMORIZE A SEQUÊNCIA..." : started ? "SUA VEZ!" : "LIGUE O SOM"}
      </div>

      <style>{`
        .retro-blink {
          animation: blink 1s step-end infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}