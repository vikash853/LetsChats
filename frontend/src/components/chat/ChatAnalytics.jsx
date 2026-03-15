import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { format } from "date-fns";
import { parseVanish } from "./VanishMessage";

const StatCard = ({ emoji, label, value, sub }) => (
  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex flex-col gap-1">
    <span className="text-2xl">{emoji}</span>
    <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">{value}</p>
    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</p>
    {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500">{sub}</p>}
  </div>
);

const ChatAnalytics = ({ messages, onClose }) => {
  const { user } = useAuth();

  const stats = useMemo(() => {
    if (!messages || messages.length === 0) return null;

    const myMsgs    = messages.filter((m) => m.sender._id === user._id);
    const theirMsgs = messages.filter((m) => m.sender._id !== user._id);

    const countWords = (msgs) =>
      msgs.reduce((acc, m) => {
        const text = parseVanish(m.content)?.text || m.content || "";
        return acc + text.split(/\s+/).filter(Boolean).length;
      }, 0);

    const allText = messages.map((m) => parseVanish(m.content)?.text || m.content || "").join(" ");
    const emojiCount = (allText.match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu) || []).length;

    const hourCounts = {};
    messages.forEach((m) => {
      const h = new Date(m.createdAt).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const peakLabel = peakHour !== undefined
      ? (Number(peakHour) === 0 ? "12am" : Number(peakHour) < 12 ? `${peakHour}am` : Number(peakHour) === 12 ? "12pm" : `${peakHour - 12}pm`)
      : "—";

    const longestMsg = [...messages]
      .filter((m) => !m.isDeleted)
      .sort((a, b) => {
        const ta = (parseVanish(a.content)?.text || a.content || "").length;
        const tb = (parseVanish(b.content)?.text || b.content || "").length;
        return tb - ta;
      })[0];

    const longestText = longestMsg ? (parseVanish(longestMsg.content)?.text || longestMsg.content || "") : "";
    const myShare = messages.length > 0 ? Math.round((myMsgs.length / messages.length) * 100) : 0;
    const startDate = messages[0] ? format(new Date(messages[0].createdAt), "MMM d, yyyy") : "—";

    return { total: messages.length, myCount: myMsgs.length, myShare, myWords: countWords(myMsgs), emojiCount, peakLabel, longestText, longestSender: longestMsg?.sender?.username, startDate };
  }, [messages, user._id]);

  if (!stats) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-semibold text-slate-800 dark:text-slate-200">No messages yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Send some messages first to see stats</p>
          <button onClick={onClose} className="px-6 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-slide-up overflow-hidden max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">📊 Chat stats</h3>
            <p className="text-xs text-slate-400 mt-0.5">Since {stats.startDate}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Share bar */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="text-brand-600 dark:text-brand-400">You — {stats.myShare}%</span>
              <span className="text-slate-500">Them — {100 - stats.myShare}%</span>
            </div>
            <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${stats.myShare}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard emoji="💬" label="Total messages" value={stats.total.toLocaleString()} />
            <StatCard emoji="✍️" label="Your messages"  value={stats.myCount.toLocaleString()} sub={`${stats.myWords.toLocaleString()} words`} />
            <StatCard emoji="🕐" label="Most active"    value={stats.peakLabel} />
            <StatCard emoji="😂" label="Emojis sent"    value={stats.emojiCount.toLocaleString()} />
          </div>

          {stats.longestText && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium mb-2">
                📏 Longest message ({stats.longestText.length} chars)
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 italic">"{stats.longestText}"</p>
              {stats.longestSender && <p className="text-[11px] text-slate-400 mt-1">— {stats.longestSender}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatAnalytics;