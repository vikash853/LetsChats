import { useState } from "react";
import Avatar from "../ui/Avatar";
import { formatMessageTime } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import { messagesAPI } from "../../services/api";
import { useChat } from "../../context/ChatContext";
import { VanishBubble, parseVanish, isMessageVanished, markMessageVanished } from "./VanishMessage";

const StatusTicks = ({ status }) => {
  if (status === "read")      return <span className="text-sky-300 text-[10px]">✓✓</span>;
  if (status === "delivered") return <span className="text-white/50 text-[10px]">✓✓</span>;
  return <span className="text-white/50 text-[10px]">✓</span>;
};

const REACTIONS = ["❤️","😂","😮","😢","👍","🔥"];

const ReplyPreview = ({ replyTo, isOwn }) => {
  if (!replyTo) return null;
  const text = parseVanish(replyTo.content)?.text || replyTo.content || "";
  return (
    <div className={`flex items-start gap-2 px-3 py-1.5 mb-1 rounded-xl text-xs
      ${isOwn
        ? "bg-white/20 text-white/80 border-l-2 border-white/60"
        : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-l-2 border-brand-400"}`}>
      <div className="min-w-0">
        <p className="font-semibold truncate">{replyTo.sender?.username || "Unknown"}</p>
        <p className="truncate opacity-80">{text.slice(0, 60)}{text.length > 60 ? "…" : ""}</p>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, showAvatar = true, onReply }) => {
  const { user }        = useAuth();
  const { setMessages } = useChat();
  const isOwn = message.sender._id === user._id;

  // Use exported helper — checks localStorage immediately on mount
  const [vanished,      setVanished]      = useState(() => isMessageVanished(message._id));
  const [showMenu,      setShowMenu]      = useState(false);
  const [reactions,     setReactions]     = useState(message.reactions || {});
  const [showReactions, setShowReactions] = useState(false);
  const [copied,        setCopied]        = useState(false);

  const vanishData     = parseVanish(message.content);
  const isVanish       = !!vanishData;
  const displayContent = isVanish ? vanishData.text : message.content;

  if (vanished) {
    return (
      <div className={`flex items-end gap-2 mb-0.5 ${isOwn ? "flex-row-reverse" : ""}`}>
        <div className="w-8 flex-shrink-0" />
        <p className="text-xs text-slate-400 dark:text-slate-500 italic px-3 py-1">💨 Message vanished</p>
      </div>
    );
  }

  if (message.isDeleted) {
    return (
      <div className={`flex items-end gap-2 mb-0.5 ${isOwn ? "flex-row-reverse" : ""}`}>
        <div className="w-8 flex-shrink-0" />
        <p className="text-xs text-slate-400 dark:text-slate-500 italic px-3 py-1">🚫 This message was deleted</p>
      </div>
    );
  }

  const handleReaction = (emoji) => {
    setReactions((prev) => {
      const current = prev[emoji] || [];
      const already = current.includes(user._id);
      return { ...prev, [emoji]: already ? current.filter((id) => id !== user._id) : [...current, user._id] };
    });
    setShowReactions(false);
  };

  const handleCopy = () => {
    if (displayContent) { navigator.clipboard.writeText(displayContent); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    setShowMenu(false);
  };

  const handleDelete = async () => {
    try {
      await messagesAPI.delete(message._id);
      setMessages((prev) => prev.map((m) => m._id === message._id ? { ...m, isDeleted: true } : m));
    } catch (err) { console.error("Delete failed:", err.message); }
    setShowMenu(false);
  };

  const activeReactions = Object.entries(reactions).filter(([, users]) => users.length > 0);

  return (
    <div className={`flex items-end gap-2 mb-0.5 group animate-fade-in ${isOwn ? "flex-row-reverse" : ""}`}
      onMouseLeave={() => { setShowMenu(false); setShowReactions(false); }}>

      <div className="w-8 flex-shrink-0 self-end mb-1">
        {showAvatar && !isOwn && <Avatar user={message.sender} size="sm" />}
      </div>

      <div className={`flex flex-col max-w-[68%] ${isOwn ? "items-end" : "items-start"}`}>
        {showAvatar && !isOwn && (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5 ml-1">
            {message.sender.username}
          </span>
        )}

        <div className={`flex items-center gap-1 mb-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? "flex-row-reverse" : ""}`}>
          <button onClick={() => { onReply?.(message); setShowMenu(false); }} title="Reply"
            className="p-1 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs shadow-sm hover:text-brand-500 transition-colors">↩️</button>
          <button onClick={() => setShowReactions((v) => !v)}
            className="p-1 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs shadow-sm hover:text-brand-500 transition-colors">😊</button>
          <button onClick={() => setShowMenu((v) => !v)}
            className="p-1 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm hover:text-brand-500 text-slate-500 transition-colors">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
            </svg>
          </button>
        </div>

        {showReactions && (
          <div className={`flex gap-1 mb-1 p-1.5 bg-white dark:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-600 shadow-lg animate-fade-in ${isOwn ? "flex-row-reverse" : ""}`}>
            {REACTIONS.map((emoji) => (
              <button key={emoji} onClick={() => handleReaction(emoji)}
                className="text-lg hover:scale-125 transition-transform w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-600">{emoji}</button>
            ))}
          </div>
        )}

        {showMenu && (
          <div className="mb-1 py-1 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 shadow-xl z-10 min-w-[140px] animate-fade-in">
            <button onClick={() => { onReply?.(message); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">↩️ Reply</button>
            <button onClick={handleCopy} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
              {copied ? "✓ Copied!" : "📋 Copy text"}
            </button>
            {isOwn && (
              <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">🗑️ Delete</button>
            )}
          </div>
        )}

        <div className={`relative px-3.5 py-2 text-sm leading-relaxed shadow-sm
          ${isVanish
            ? isOwn
              ? "bg-red-500 text-white rounded-2xl rounded-br-sm"
              : "bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-200 border-2 border-red-200 dark:border-red-500/30 rounded-2xl rounded-bl-sm"
            : isOwn
              ? "bg-brand-500 text-white rounded-2xl rounded-br-sm"
              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-sm"
          }`}>

          {message.replyTo && <ReplyPreview replyTo={message.replyTo} isOwn={isOwn} />}
          {isVanish && <span className="text-xs opacity-80 mr-1">💣</span>}

          {message.messageType === "image" && message.fileUrl && (
            <img src={message.fileUrl} alt="attachment" className="max-w-[240px] rounded-xl mb-1 cursor-pointer hover:opacity-90" onClick={() => window.open(message.fileUrl, "_blank")} />
          )}
          {message.messageType === "file" && message.fileUrl && (
            <a href={message.fileUrl} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-2 text-sm underline underline-offset-2 ${isOwn ? "text-white/90" : "text-brand-600 dark:text-brand-400"}`}>
              <span>📎</span><span>{message.fileName || "Download file"}</span>
            </a>
          )}
          {message.messageType === "voice" && message.fileUrl && (
            <div className="flex items-center gap-2">
              <span className="text-lg">🎤</span>
              <audio controls src={message.fileUrl} className="h-8" style={{ maxWidth: "200px" }} />
            </div>
          )}
          {displayContent && <p className="whitespace-pre-wrap break-words">{displayContent}</p>}
        </div>

        {isVanish && vanishData && (
          <VanishBubble
            vanishData={vanishData}
            messageId={message._id}
            isOwn={isOwn}
            onExpired={(id) => { markMessageVanished(id); setVanished(true); }}
          />
        )}

        {activeReactions.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {activeReactions.map(([emoji, users]) => (
              <button key={emoji} onClick={() => handleReaction(emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all
                  ${users.includes(user._id)
                    ? "bg-brand-50 dark:bg-brand-500/20 border-brand-200 dark:border-brand-500/30 text-brand-600 dark:text-brand-400"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"}`}>
                <span>{emoji}</span><span className="font-medium">{users.length}</span>
              </button>
            ))}
          </div>
        )}

        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatMessageTime(message.createdAt)}</span>
          {isOwn && <StatusTicks status={message.status} />}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;