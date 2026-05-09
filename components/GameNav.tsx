"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const GAMES = [
  { url: "/", label: "HOME", letter: "H", color: "#ffffff" },
  { url: "/genius", label: "GENIUS", letter: "G", color: "#00ff80" },
  { url: "/mines", label: "MINES", letter: "M", color: "#ff3366" },
  { url: "/snac", label: "SNAKE", letter: "S", color: "#ffcc00" },
  { url: "/drop", label: "DROP", letter: "D", color: "#00ccff" },
  { url: "/puzzle", label: "PUZZLE", letter: "P", color: "#b300ff" },
  { url: "/flappy", label: "FLAPPY", letter: "F", color: "#00ffff" },
  { url: "/whack", label: "WHACK", letter: "W", color: "#ff00ff" },
];

function GameLink({ url, label, letter, color, active }: { url: string; label: string; letter: string; color: string; active: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={url}
      className={`relative px-3 sm:px-4 py-2 flex items-center gap-1 sm:gap-2 rounded-lg text-[10px] sm:text-[12px] font-mono tracking-[1px] sm:tracking-[2px] transition-all duration-300 border ${
        active 
          ? 'bg-[#1a1a2e] border-[#333] shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]' 
          : 'bg-transparent border-transparent hover:bg-[#1a1a2e]/50 hover:border-[#333]/50'
      }`}
      style={{
        color: active || hovered ? color : '#666',
        textShadow: active || hovered ? `0 0 10px ${color}40` : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="font-bold">{label}</span>
      {(active || hovered) && (
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-t-full transition-all duration-300"
          style={{ 
            width: active ? '40%' : hovered ? '20%' : '0%',
            background: color,
            boxShadow: `0 -2px 10px ${color}`
          }}
        />
      )}
    </Link>
  );
}

export default function GameNav() {
  const pathname = usePathname();

  return (
    <header className="w-full bg-[#050508]/90 backdrop-blur-md border-b border-white/5 p-2 sm:p-3 flex items-center justify-between z-50 sticky top-0 font-mono">
      <div className="flex items-center px-1 sm:px-2 flex-shrink-0">
        <Link href="/" className="text-[9px] sm:text-[10px] tracking-[2px] sm:tracking-[4px] text-[#00ff80] uppercase opacity-80 hover:opacity-100 transition-opacity flex items-center gap-1.5 sm:gap-2">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00ff80] animate-pulse shadow-[0_0_8px_#00ff80]" />
          <span className="hidden sm:inline">Games Eventos</span>
          <span className="sm:hidden font-bold">GE</span>
        </Link>
      </div>

      <nav className="flex items-center gap-0.5 sm:gap-2 overflow-x-auto">
        {GAMES.map((game) => (
          <GameLink 
            key={game.url} 
            url={game.url} 
            label={game.label} 
            letter={game.letter}
            color={game.color}
            active={pathname === game.url}
          />
        ))}
      </nav>
    </header>
  );
}