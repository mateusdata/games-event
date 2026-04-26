"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const games = [
  { url: "/", label: "🏠 Home" },
  { url: "/genius", label: "🧠 Genius" },
  { url: "/mines", label: "💣 Mines" },
];

function GameLink({ url, label }: { url: string; label: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={url}
      style={{
        backgroundColor: hovered ? "#2a2a2a" : "#1a1a1a",
        color: "#fff",
        padding: "8px 16px",
        borderRadius: "8px",
        border: "1px solid #333",
        fontSize: "14px",
        fontFamily: "monospace",
        textDecoration: "none",
        transition: "background 0.2s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </Link>
  );
}

export default function GameNav() {
  const pathname = usePathname();

  return (
    <header style={{
      width: "100%",
      backgroundColor: "#111",
      borderBottom: "1px solid #222",
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
    }}>
      <span style={{ color: "#555", fontSize: "14px", marginRight: "4px" }}>
        jogar:
      </span>

      {games
        .filter((game) => game.url !== pathname)
        .map((game) => (
          <GameLink key={game.url} url={game.url} label={game.label} />
        ))}
    </header>
  );
}