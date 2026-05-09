"use client";

import Link from "next/link";
import { useState } from "react";

const GAMES = [
  { id: "genius", name: "GENIUS", path: "/genius", color: "#00ff80", letter: "G" },
  { id: "mines", name: "MINES", path: "/mines", color: "#ff3366", letter: "M" },
  { id: "snake", name: "SNAKE", path: "/snac", color: "#ffcc00", letter: "S" },
  { id: "drop", name: "DROP COIN", path: "/drop", color: "#00ccff", letter: "D" },
];

export default function Home() {
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);

  return (
    <div className="flex-1 min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center font-mono p-5 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-10 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.08)_2px,rgba(0,0,0,0.08)_4px)]" />

      <div 
        className="fixed top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none transition-all duration-700 ease-in-out"
        style={{
          background: hoveredGame 
            ? `radial-gradient(circle, ${GAMES.find(g => g.id === hoveredGame)?.color}15 0%, transparent 70%)`
            : 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)'
        }}
      />

      <div className="text-center mb-16 z-10">
        <div className="text-[14px] tracking-[8px] text-[#00ff80] mb-4 uppercase opacity-70">
          Bem Vindo ao
        </div>
        <h1 className="text-[clamp(40px,8vw,80px)] font-black m-0 text-white tracking-tighter leading-none drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]">
          GAMES EVENTOS
        </h1>
        <div className="mt-6 text-[#444] text-[12px] tracking-[4px] uppercase">
          SELECIONE UM JOGO PARA INICIAR
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 z-10 w-full max-w-[1000px] px-4">
        {GAMES.map((game) => {
          const isHovered = hoveredGame === game.id;
          return (
            <Link 
              key={game.id} 
              href={game.path}
              onMouseEnter={() => setHoveredGame(game.id)}
              onMouseLeave={() => setHoveredGame(null)}
              className="relative group block"
            >
              <div 
                className="absolute inset-0 rounded-[24px] blur-xl transition-all duration-500 opacity-0 group-hover:opacity-100"
                style={{ background: game.color, opacity: isHovered ? 0.3 : 0 }}
              />
              <div 
                className="relative h-[200px] bg-[#0d0d16] border transition-all duration-300 flex flex-col items-center justify-center rounded-[24px] overflow-hidden"
                style={{ 
                  borderColor: isHovered ? game.color : '#1a1a2e',
                  transform: isHovered ? 'translateY(-4px)' : 'none',
                  boxShadow: isHovered ? `0 10px 40px ${game.color}20, inset 0 0 20px ${game.color}10` : 'inset 0 0 40px rgba(0,0,0,0.5)'
                }}
              >
                <div 
                  className="text-5xl mb-4 font-black transform transition-all duration-300 group-hover:scale-110 opacity-80"
                  style={{ color: game.color, textShadow: `0 0 20px ${game.color}80` }}
                >
                  [{game.letter}]
                </div>
                <h2 
                  className="text-2xl font-black tracking-[4px] transition-colors duration-300"
                  style={{ color: isHovered ? game.color : '#fff' }}
                >
                  {game.name}
                </h2>
                <div 
                  className="absolute bottom-4 text-[10px] tracking-[3px] uppercase opacity-0 transition-all duration-300 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0"
                  style={{ color: game.color }}
                >
                  Jogar Agora
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}