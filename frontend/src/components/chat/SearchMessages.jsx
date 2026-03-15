/**
 * SearchMessages
 * Search through messages in the current conversation.
 * Highlights matching messages and jumps to them.
 */
import { useState, useMemo, useRef } from "react";
import { parseVanish } from "./VanishMessage";
import { formatMessageTime } from "../../utils/helpers";

const SearchMessages = ({ messages, onClose, onJumpTo }) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return messages
      .filter((m) => {
        if (m.isDeleted) return false;
        const text = parseVanish(m.content)?.text || m.content || "";
        return text.toLowerCase().includes(q);
      })
      .slice(0, 20); // cap at 20 results
  }, [query, messages]);

  const highlight = (text, q) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 dark:bg-yellow-500/40 text-slate-900 dark:text-slate-100 rounded px-0.5">
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div className="absolute inset-0 z-30 bg-white dark:bg-slate-900 flex flex-col animate-slide-up">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <button onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm
              bg-slate-100 dark:bg-slate-800
              text-slate-900 dark:text-slate-100
              placeholder-slate-400 dark:placeholder-slate-500
              border border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {query && (
            <button onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg">×</button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {query.length < 2 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <span className="text-4xl">🔍</span>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Type at least 2 characters to search</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <span className="text-4xl">😕</span>
            <p className="font-medium text-slate-700 dark:text-slate-300">No messages found</p>
            <p className="text-sm text-slate-400">Try a different search term</p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-2.5">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
            {results.map((msg) => {
              const text = parseVanish(msg.content)?.text || msg.content || "";
              return (
                <button key={msg._id}
                  onClick={() => { onJumpTo(msg._id); onClose(); }}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b border-slate-100 dark:border-slate-800">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {msg.sender?.username || "Unknown"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {highlight(text, query)}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchMessages;