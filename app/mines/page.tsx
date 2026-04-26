"use client";

import { useEffect, useState, useCallback } from "react";

const ROWS = 10;
const COLS = 10;
const MINES_COUNT = 15;

type CellData = {
  r: number;
  c: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

function generateBoard(firstClickR: number, firstClickC: number): CellData[][] {
  const board: CellData[][] = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => ({
      r, c,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      neighborMines: 0,
    }))
  );

  let minesPlaced = 0;
  while (minesPlaced < MINES_COUNT) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    
    if (!board[r][c].isMine && (r !== firstClickR || c !== firstClickC)) {
      board[r][c].isMine = true;
      minesPlaced++;
    }
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!board[r][c].isMine) {
        let count = 0;
        for (const [dr, dc] of DIRS) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].isMine) {
            count++;
          }
        }
        board[r][c].neighborMines = count;
      }
    }
  }

  return board;
}

export default function MinesGame() {
  const [board, setBoard] = useState<CellData[][]>([]);
  const [score, setScore] = useState<number>(0);
  const [best, setBest] = useState<number>(0);
  const [dead, setDead] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);
  const [started, setStarted] = useState<boolean>(false); // Controla se as bombas já foram geradas
  const [showIntro, setShowIntro] = useState<boolean>(true); // Controla a tela de introdução

  useEffect(() => {
    const stored = (globalThis as any).localStorage?.getItem("mines-best");
    if (stored) setBest(Number(stored));
    initEmptyBoard();
  }, []);

  const updateBestScore = useCallback((newScore: number) => {
    if (newScore > best) {
      setBest(newScore);
      (globalThis as any).localStorage?.setItem("mines-best", newScore.toString());
    }
  }, [best]);

  const initEmptyBoard = () => {
    const empty: CellData[][] = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => ({
        r, c, isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0
      }))
    );
    setBoard(empty);
  };

  const reset = useCallback(() => {
    setScore(0);
    setDead(false);
    setWon(false);
    setStarted(false);
    setShowIntro(false); // Esconde a introdução ao clicar para começar
    initEmptyBoard();
  }, []);

  const revealCell = (r: number, c: number) => {
    if (dead || won || board[r][c].isFlagged || board[r][c].isRevealed || showIntro) return;

    let currentBoard = board;
    
    // Gera o tabuleiro no primeiro clique real do usuário
    if (!started) {
      currentBoard = generateBoard(r, c);
      setStarted(true);
    }

    if (currentBoard[r][c].isMine) {
      const newBoard = currentBoard.map(row => row.map(cell => ({
        ...cell,
        isRevealed: cell.isMine ? true : cell.isRevealed
      })));
      setBoard(newBoard);
      setDead(true);
      return;
    }

    const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));
    let newScore = score;

    const stack = [[r, c]];
    while (stack.length > 0) {
      const [currR, currC] = stack.pop()!;
      const cell = newBoard[currR][currC];

      if (!cell.isRevealed && !cell.isFlagged) {
        cell.isRevealed = true;
        newScore++;

        if (cell.neighborMines === 0) {
          for (const [dr, dc] of DIRS) {
            const nr = currR + dr, nc = currC + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              stack.push([nr, nc]);
            }
          }
        }
      }
    }

    setBoard(newBoard);
    setScore(newScore);
    updateBestScore(newScore);

    const targetScore = (ROWS * COLS) - MINES_COUNT;
    if (newScore === targetScore) {
      setWon(true);
    }
  };

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (dead || won || !started || showIntro || board[r][c].isRevealed) return;

    const newBoard = [...board];
    newBoard[r] = [...board[r]];
    newBoard[r][c] = { ...board[r][c], isFlagged: !board[r][c].isFlagged };
    setBoard(newBoard);
  };

  const getNumberColor = (num: number) => {
    const colors = [
      "", "#00ccff", "#00ff80", "#ff3366", 
      "#ffcc00", "#ff00ff", "#00ffff", "#ffffff", "#888888"
    ];
    return colors[num] || "#fff";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center font-mono p-5 relative overflow-hidden select-none">
      
      <div className="fixed inset-0 pointer-events-none z-10 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.08)_2px,rgba(0,0,0,0.08)_4px)]" />

      <div className="fixed top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(0,255,128,0.04)_0%,transparent_70%)]" />

      <div className="text-center mb-8 z-10">
        <div className="text-[11px] tracking-[6px] text-[#00ff80] mb-2 uppercase opacity-70">
          Games Eventos
        </div>
        <h1 className="text-[clamp(28px,6vw,48px)] font-black m-0 text-white tracking-tighter leading-none drop-shadow-[0_0_40px_rgba(0,255,128,0.3)]">
          MINES
        </h1>
      </div>

      <div className="flex gap-8 mb-5 z-10 text-xs tracking-[3px] uppercase">
        <div className="text-center">
          <div className="text-[#444] mb-0.5">Score</div>
          <div className="text-[#00ff80] text-xl font-bold">{score}</div>
        </div>
        <div className="w-px bg-[#1a1a2e]" />
        <div className="text-center">
          <div className="text-[#444] mb-0.5">Best</div>
          <div className="text-white text-xl font-bold">{best}</div>
        </div>
      </div>

      <div className="relative bg-[#0d0d16] border border-[#1a1a2e] shadow-[0_0_60px_rgba(0,255,128,0.08),inset_0_0_40px_rgba(0,0,0,0.5)] p-3 rounded-2xl z-10">
        
        <div 
          className="grid gap-1" 
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {board.map((row, r) => 
            row.map((cell, c) => {
              const isDanger = dead && cell.isMine;
              
              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => revealCell(r, c)}
                  onContextMenu={(e) => toggleFlag(e, r, c)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-[4px] text-sm font-bold transition-all duration-100 ${
                    cell.isRevealed
                      ? cell.isMine
                        ? "bg-[#ff3366] shadow-[0_0_15px_#ff3366]"
                        : "bg-[#11111a] border border-[#1a1a2e]"
                      : "bg-[#1a1a2e] border border-[#2a2a3e] hover:bg-[#222233] cursor-pointer"
                  }`}
                >
                  {cell.isRevealed ? (
                    cell.isMine ? (
                      <span className="text-white">¤</span>
                    ) : (
                      cell.neighborMines > 0 && (
                        <span 
                          style={{ color: getNumberColor(cell.neighborMines), textShadow: `0 0 8px ${getNumberColor(cell.neighborMines)}80` }}
                        >
                          {cell.neighborMines}
                        </span>
                      )
                    )
                  ) : cell.isFlagged ? (
                    <span className="text-[#ffcc00] drop-shadow-[0_0_8px_rgba(255,204,0,0.8)]">⚑</span>
                  ) : isDanger ? (
                    <span className="text-[#ff3366] opacity-50">¤</span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {(dead || won || showIntro) && (
          <div 
            onClick={() => reset()}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f]/85 backdrop-blur-[4px] rounded-2xl cursor-pointer"
          >
            {won ? (
              <>
                <div className="text-[#00ccff] text-[22px] font-black tracking-[4px] mb-2 drop-shadow-[0_0_15px_rgba(0,204,255,0.8)]">
                  YOU WIN
                </div>
                <div className="text-[#444] text-[11px] tracking-[3px]">
                  SCORE MAX: <span className="text-white">{score}</span>
                </div>
                <div className="mt-5 text-[#00ff80] text-[11px] tracking-[3px] retro-blink">
                  CLIQUE PARA JOGAR
                </div>
              </>
            ) : dead ? (
              <>
                <div className="text-[#ff3366] text-[22px] font-black tracking-[4px] mb-2 drop-shadow-[0_0_15px_rgba(255,51,102,0.8)]">
                  GAME OVER
                </div>
                <div className="text-[#444] text-[11px] tracking-[3px]">
                  SCORE: <span className="text-white">{score}</span>
                </div>
                <div className="mt-5 text-[#00ff80] text-[11px] tracking-[3px] retro-blink">
                  CLIQUE PARA TENTAR DE NOVO
                </div>
              </>
            ) : (
              <>
                <div className="text-[#00ff80] text-[13px] tracking-[4px] mb-1.5">
                  CAMPO MINADO
                </div>
                <div className="text-[#333] text-[11px] tracking-[2px] mb-5">
                  L-CLICK: REVELAR | R-CLICK: MARCAR
                </div>
                <div className="text-[#00ff80] text-[11px] tracking-[3px] retro-blink">
                  CLIQUE PARA INICIAR
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 text-[#222] text-[10px] tracking-[3px] uppercase z-10 text-center">
        Left Click = Revelar <br className="sm:hidden" /> <span className="hidden sm:inline">|</span> Right Click = Marcar
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