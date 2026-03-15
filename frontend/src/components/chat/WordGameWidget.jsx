/**
 * WordGameWidget — Play a word guessing game inside the chat!
 * Send a game challenge to the other person.
 * Nobody has inline mini-games in a chat app.
 */
import { useState } from "react";
import { useChat } from "../../context/ChatContext";

const WORDS = [
  "REACT", "SOCKET", "MONGO", "NODE", "VITE",
  "CHAT", "CODE", "BUILD", "DEPLOY", "SERVER",
  "LOGIN", "TOKEN", "CLOUD", "DEBUG", "FETCH",
  "PROXY", "STYLE", "ROUTE", "STORE", "QUEUE",
];

const MAX_GUESSES = 6;

const getRandomWord = () => WORDS[Math.floor(Math.random() * WORDS.length)];

const LetterBox = ({ letter, status }) => {
  const colors = {
    correct: "bg-emerald-500 text-white border-emerald-500",
    present: "bg-amber-400 text-white border-amber-400",
    absent:  "bg-slate-400 dark:bg-slate-600 text-white border-slate-400",
    empty:   "bg-transparent border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100",
    active:  "bg-transparent border-slate-500 dark:border-slate-400 text-slate-900 dark:text-slate-100",
  };
  return (
    <div className={`w-11 h-11 border-2 rounded-lg flex items-center justify-center font-bold text-sm uppercase transition-all ${colors[status || "empty"]}`}>
      {letter}
    </div>
  );
};

const WordGameWidget = ({ onClose }) => {
  const { sendMessage } = useChat();
  const [word]     = useState(getRandomWord);
  const [guesses,  setGuesses]  = useState([]);
  const [current,  setCurrent]  = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won,      setWon]      = useState(false);
  const [shared,   setShared]   = useState(false);

  const getLetterStatuses = (guess) => {
    return guess.split("").map((letter, i) => {
      if (word[i] === letter) return "correct";
      if (word.includes(letter)) return "present";
      return "absent";
    });
  };

  const handleKey = (key) => {
    if (gameOver) return;
    if (key === "ENTER") {
      if (current.length !== 5) return;
      const newGuesses = [...guesses, current];
      setGuesses(newGuesses);
      if (current === word) { setWon(true); setGameOver(true); }
      else if (newGuesses.length >= MAX_GUESSES) { setGameOver(true); }
      setCurrent("");
    } else if (key === "⌫") {
      setCurrent((c) => c.slice(0, -1));
    } else if (current.length < 5 && /^[A-Z]$/.test(key)) {
      setCurrent((c) => c + key);
    }
  };

  const shareResult = async () => {
    const emoji = guesses.map((g) =>
      getLetterStatuses(g).map((s) =>
        s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛"
      ).join("")
    ).join("\n");
    const result = `🎯 Word Game in ChatApp!\n${won ? `Solved in ${guesses.length}/${MAX_GUESSES}` : "Failed 😢"}\n\n${emoji}`;
    await sendMessage(result, "text");
    setShared(true);
    setTimeout(onClose, 800);
  };

  const KEYBOARD = [
    ["Q","W","E","R","T","Y","U","I","O","P"],
    ["A","S","D","F","G","H","J","K","L"],
    ["ENTER","Z","X","C","V","B","N","M","⌫"],
  ];

  // Get letter status for keyboard coloring
  const letterStatuses = {};
  guesses.forEach((g) => {
    getLetterStatuses(g).forEach((status, i) => {
      const l = g[i];
      if (!letterStatuses[l] || status === "correct") letterStatuses[l] = status;
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-slide-up overflow-hidden">

        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Word Game</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{guesses.length}/{MAX_GUESSES}</span>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Grid */}
          <div className="flex flex-col gap-1.5 mb-4 items-center">
            {Array.from({ length: MAX_GUESSES }).map((_, rowIdx) => {
              const guess    = guesses[rowIdx];
              const isActive = rowIdx === guesses.length && !gameOver;
              const statuses = guess ? getLetterStatuses(guess) : null;
              const letters  = isActive ? current.padEnd(5, " ").split("") : (guess ? guess.split("") : Array(5).fill(""));
              return (
                <div key={rowIdx} className="flex gap-1.5">
                  {letters.map((l, i) => (
                    <LetterBox key={i} letter={l.trim()} status={
                      statuses ? statuses[i] : isActive && l.trim() ? "active" : "empty"
                    } />
                  ))}
                </div>
              );
            })}
          </div>

          {/* Game over state */}
          {gameOver && (
            <div className={`text-center py-3 px-4 rounded-xl mb-3 ${won ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-red-50 dark:bg-red-500/10"}`}>
              <p className={`font-bold text-sm ${won ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                {won ? `🎉 You got it in ${guesses.length}!` : `😢 The word was ${word}`}
              </p>
              <button onClick={shareResult} disabled={shared}
                className="mt-2 px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                {shared ? "Shared! ✓" : "📤 Share result in chat"}
              </button>
            </div>
          )}

          {/* Keyboard */}
          <div className="flex flex-col gap-1">
            {KEYBOARD.map((row, ri) => (
              <div key={ri} className="flex justify-center gap-1">
                {row.map((key) => {
                  const status = letterStatuses[key];
                  const isWide = key === "ENTER" || key === "⌫";
                  const bgColor = status === "correct" ? "bg-emerald-500 text-white"
                    : status === "present" ? "bg-amber-400 text-white"
                    : status === "absent"  ? "bg-slate-400 dark:bg-slate-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200";
                  return (
                    <button key={key} onClick={() => handleKey(key)}
                      className={`${isWide ? "px-2 text-[11px]" : "w-8"} h-10 rounded-lg font-semibold text-xs transition-all hover:opacity-80 active:scale-95 ${bgColor}`}>
                      {key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordGameWidget;