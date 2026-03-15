import { useState, useEffect, useRef } from "react";
import { useChat } from "../../context/ChatContext";

const TIMERS = [
  { label: "10s",   seconds: 10  },
  { label: "30s",   seconds: 30  },
  { label: "1 min", seconds: 60  },
  { label: "5 min", seconds: 300 },
];

// ── Safe parser ──────────────────────────────────────────────────
export const parseVanish = (content) => {
  if (!content || typeof content !== "string") return null;
  if (!content.startsWith("__VANISH__")) return null;
  try {
    const parsed = JSON.parse(content.replace("__VANISH__", ""));
    if (!parsed || !parsed.text) return null;
    return {
      text:         parsed.text || "",
      totalSeconds: parsed.totalSeconds || 60,
      seenAt:       parsed.seenAt || null,
    };
  } catch { return null; }
};

// ── Persist vanished IDs so they stay gone after refresh ─────────
const VANISHED_KEY = "chatapp_vanished_v2";
export const isMessageVanished = (id) => {
  try {
    return JSON.parse(localStorage.getItem(VANISHED_KEY) || "[]").includes(id);
  } catch { return false; }
};
export const markMessageVanished = (id) => {
  try {
    const ids = JSON.parse(localStorage.getItem(VANISHED_KEY) || "[]");
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(VANISHED_KEY, JSON.stringify(ids));
    }
  } catch {}
};

// ── VanishBubble: countdown — only starts after recipient reads ──
export const VanishBubble = ({ vanishData, messageId, isOwn, onExpired }) => {
  if (!vanishData || typeof vanishData !== "object") return null;

  const totalSeconds = vanishData.totalSeconds || 60;
  const [seenAt,    setSeenAt]    = useState(vanishData.seenAt || null);
  const [remaining, setRemaining] = useState(null);
  const timerRef = useRef(null);

  // Recipient: mark as seen immediately on first render
  useEffect(() => {
    if (!isOwn && !seenAt) setSeenAt(Date.now());
  }, []);

  // Start countdown once seenAt is known
  useEffect(() => {
    const startTime = isOwn ? seenAt : Date.now();
    if (!startTime) return;
    const end = Number(startTime) + totalSeconds * 1000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(timerRef.current);
        // Persist vanished state BEFORE calling onExpired
        markMessageVanished(messageId);
        onExpired?.(messageId);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [seenAt]);

  // Sender hasn't been seen yet
  if (isOwn && !seenAt) {
    return (
      <div className="flex items-center gap-1.5 mt-1">
        <div className="w-5 h-5 rounded-full border-2 border-dashed border-orange-400 flex items-center justify-center">
          <span style={{ fontSize: "9px" }}>👁</span>
        </div>
        <span className="text-[10px] text-orange-400 font-medium">Waiting to be read…</span>
      </div>
    );
  }

  const r    = 9;
  const circ = 2 * Math.PI * r;
  const pct  = remaining !== null ? Math.max(0, (remaining / totalSeconds) * 100) : 100;
  const dash = (pct / 100) * circ;
  const isUrgent = remaining !== null && remaining <= 10;

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <svg width="22" height="22" viewBox="0 0 22 22" className="flex-shrink-0">
        <circle cx="11" cy="11" r={r} fill="none" stroke={isUrgent ? "#fca5a5" : "#fde68a"} strokeWidth="1.5"/>
        <circle cx="11" cy="11" r={r} fill="none"
          stroke={isUrgent ? "#ef4444" : "#f59e0b"}
          strokeWidth="2.5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 11 11)"
          style={{ transition: "stroke-dasharray 0.8s linear" }}
        />
        <text x="11" y="15" textAnchor="middle" fontSize="6.5" fontWeight="700"
          fill={isUrgent ? "#ef4444" : "#92400e"}>
          {remaining !== null ? (remaining >= 60 ? `${Math.ceil(remaining / 60)}m` : `${remaining}s`) : "…"}
        </text>
      </svg>
      <span className={`text-[10px] font-medium ${isUrgent ? "text-red-500 animate-pulse" : "text-amber-600 dark:text-amber-400"}`}>
        {isUrgent ? "Vanishing now!" : remaining !== null
          ? `Vanishes in ${remaining >= 60 ? `${Math.ceil(remaining / 60)}m` : `${remaining}s`}`
          : "Starting…"}
      </span>
    </div>
  );
};

// ── VanishMessage modal ──────────────────────────────────────────
const VanishMessage = ({ onClose }) => {
  const { sendMessage } = useChat();
  const [text,    setText]    = useState("");
  const [timer,   setTimer]   = useState(TIMERS[0]);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const content = `__VANISH__${JSON.stringify({ text: trimmed, totalSeconds: timer.seconds, seenAt: null })}`;
      await sendMessage(content, "text");
      onClose();
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-500/10 dark:to-orange-500/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💣</span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Vanish message</h3>
              <p className="text-xs text-slate-500">Timer starts only after they read it</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Vanishes after being read for</p>
            <div className="grid grid-cols-4 gap-2">
              {TIMERS.map((t) => (
                <button key={t.label} onClick={() => setTimer(t)}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all border-2
                    ${timer.label === t.label ? "bg-red-500 text-white border-red-500 scale-105" : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-red-300"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type your secret message…" rows={3} autoFocus
            className="w-full px-4 py-3 rounded-xl text-sm border-2 resize-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600 placeholder-slate-400 focus:outline-none focus:border-red-400 transition-colors"/>
          <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3 border border-amber-200 dark:border-amber-500/30 flex items-start gap-2">
            <span className="text-amber-500 text-sm">⚠️</span>
            <p className="text-xs text-amber-700 dark:text-amber-400">Timer starts only after recipient <strong>opens and reads</strong> this message.</p>
          </div>
          <button onClick={handleSend} disabled={!text.trim() || sending}
            className="w-full py-3 font-semibold rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-sm disabled:opacity-50 transition-all text-sm">
            {sending ? "Sending…" : `💣 Send — vanishes ${timer.label} after being read`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VanishMessage;