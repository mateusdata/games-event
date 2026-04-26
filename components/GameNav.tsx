// components/GameNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const games = [
  { url: "/", label: "🏠 Home" },
  { url: "/genius", label: "🧠 Genius" },
  { url: "/mines", label: "💣 Mines" },
];

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
          <Link
            key={game.url}
            href={game.url}
            style={{
              backgroundColor: "#1a1a1a",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #333",
              fontSize: "14px",
              fontFamily: "monospace",
              textDecoration: "none",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#2a2a2a")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#1a1a1a")
            }
          >
            {game.label}
          </Link>
        ))}
    </header>
  );
}