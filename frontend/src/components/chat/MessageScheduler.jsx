/**
 * MessageScheduler — Fixed version
 * Uses setInterval to actually fire the scheduled message
 */
import { useState, useEffect } from "react";
import { useChat } from "../../context/ChatContext";

const TIMERS = [
  { label: "In 1 min",  ms: 60 * 1000        },
  { label: "In 5 min",  ms: 5 * 60 * 1000    },
  { label: "In 1 hour", ms: 60 * 60 * 1000   },
  { label: "Custom",    ms: null              },
];

// Global scheduler — runs in background, survives component unmounts
const STORAGE_KEY = "chatapp_scheduled";

export const initScheduler = (sendFn) => {
  const check = () => {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const now = Date.now();
    const remaining = [];
    items.forEach((item) => {
      if (now >= item.sendAt) {
        sendFn(item.text).catch(() => {});
      } else {
        remaining.push(item);
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  };
  check(); // check immediately on init
  return setInterval(check, 15000); // check every 15 seconds
};

const MessageScheduler = ({ onClose }) => {
  const { sendMessage } = useChat();
  const [text,      setText]      = useState("");
  const [mode,      setMode]      = useState(TIMERS[0]);
  const [date,      setDate]      = useState("");
  const [time,      setTime]      = useState("");
  const [scheduled, setScheduled] = useState(null);

  const getSendAt = () => {
    if (mode.ms !== null) return Date.now() + mode.ms;
    if (!date || !time) return null;
    return new Date(`${date}T${time}`).getTime();
  };

  const handleSchedule = () => {
    const trimmed = text.trim();
    const sendAt  = getSendAt();
    if (!trimmed || !sendAt || sendAt <= Date.now()) return;

    const items = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    items.push({ text: trimmed, sendAt, id: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

    // Start watching immediately
    const interval = setInterval(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const now    = Date.now();
      const remaining = [];
      stored.forEach((item) => {
        if (now >= item.sendAt) {
          sendMessage(item.text, "text").catch(() => {});
        } else {
          remaining.push(item);
        }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      if (remaining.length === 0) clearInterval(interval);
    }, 5000);

    setScheduled(new Date(sendAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    setTimeout(onClose, 2000);
  };

  const minDate = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-slide-up overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-500/10 dark:to-blue-500/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏰</span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Schedule message</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sends automatically at your chosen time</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {scheduled ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">✅</div>
              <p className="font-bold text-lg text-slate-800 dark:text-slate-200">Scheduled!</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Will send at {scheduled}</p>
            </div>
          ) : (
            <>
              <textarea value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Type the message to schedule…" rows={3} autoFocus
                className="w-full px-4 py-3 rounded-xl text-sm border resize-none
                  bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100
                  border-slate-200 dark:border-slate-600 placeholder-slate-400
                  focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors"/>

              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Send when?</p>
                <div className="grid grid-cols-2 gap-2">
                  {TIMERS.map((t) => (
                    <button key={t.label} onClick={() => setMode(t)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all border-2 text-left
                        ${mode.label === t.label
                          ? "bg-purple-500 text-white border-purple-500"
                          : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-purple-300"
                        }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {mode.ms === null && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                      min={minDate.slice(0, 10)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm border bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-400"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Time</label>
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm border bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-400"/>
                  </div>
                </div>
              )}

              <button onClick={handleSchedule}
                disabled={!text.trim() || (mode.ms === null && (!date || !time))}
                className="w-full py-3 font-semibold rounded-xl bg-purple-500 hover:bg-purple-600 text-white shadow-sm disabled:opacity-50 transition-all text-sm">
                ⏰ Schedule message
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageScheduler;