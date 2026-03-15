import { useState, useRef, useCallback } from "react";
import EmojiPicker      from "emoji-picker-react";
import { useChat }      from "../../context/ChatContext";
import { useTheme }     from "../../hooks/useTheme";
import { useAuth }      from "../../context/AuthContext";
import { uploadAPI }    from "../../services/api";
import SmartReply       from "./SmartReply";
import VanishMessage    from "./VanishMessage";
import MessageScheduler from "./MessageScheduler";
import WordGameWidget   from "./WordGameWidget";
import VoiceRecorder    from "./VoiceRecorder";
import { parseVanish }  from "./VanishMessage";

const MessageInput = ({ replyTo, onCancelReply }) => {
  const { sendMessage, startTyping, stopTyping, messages } = useChat();
  const { isDark } = useTheme();
  const { user }   = useAuth();

  const [text,       setText]       = useState("");
  const [showEmoji,  setShowEmoji]  = useState(false);
  const [showVanish, setShowVanish] = useState(false);
  const [showSched,  setShowSched]  = useState(false);
  const [showGame,   setShowGame]   = useState(false);
  const [showMore,   setShowMore]   = useState(false);
  const [showVoice,  setShowVoice]  = useState(false);
  const [uploading,  setUploading]  = useState(false);

  const inputRef      = useRef(null);
  const fileRef       = useRef(null);
  const typingTimeout = useRef(null);

  const lastReceivedMsg = [...(messages || [])].reverse().find((m) => m.sender._id !== user._id);

  const handleChange = (e) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
    startTyping();
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(stopTyping, 1500);
  };

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // Attach replyTo metadata as message property
    await sendMessage(trimmed, "text", null, null, replyTo || null);
    setText("");
    stopTyping();
    onCancelReply?.();
    if (inputRef.current) inputRef.current.style.height = "auto";
    inputRef.current?.focus();
  }, [text, sendMessage, stopTyping, replyTo, onCancelReply]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") onCancelReply?.();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await uploadAPI.attachment(fd);
      await sendMessage(file.name, file.type.startsWith("image/") ? "image" : "file", data.url, file.name);
    } catch (err) { console.error("Upload failed:", err.message); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const replyText = replyTo ? (parseVanish(replyTo.content)?.text || replyTo.content || "") : "";

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">

      {/* Reply preview bar */}
      {replyTo && (
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 animate-fade-in">
          <div className="w-0.5 h-8 bg-brand-500 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">{replyTo.sender?.username}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{replyText.slice(0, 60)}</p>
          </div>
          <button onClick={onCancelReply}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      {/* Smart Reply suggestions */}
      <SmartReply lastMessage={lastReceivedMsg} currentUserId={user._id}
        onSelect={(reply) => { setText(reply); inputRef.current?.focus(); }} />

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="absolute bottom-20 left-3 z-50 shadow-2xl rounded-2xl overflow-hidden">
          <EmojiPicker theme={isDark ? "dark" : "light"}
            onEmojiClick={(e) => { setText((p) => p + e.emoji); setShowEmoji(false); inputRef.current?.focus(); }}
            height={360} width={300} previewConfig={{ showPreview: false }} />
        </div>
      )}

      {/* More features popup */}
      {showMore && (
        <div className="mx-3 mb-2 p-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl animate-fade-in">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 pb-1.5">More features</p>
          <div className="grid grid-cols-4 gap-1">
            {[
              { icon: "💣", label: "Vanish",   action: () => { setShowVanish(true);  setShowMore(false); } },
              { icon: "⏰", label: "Schedule", action: () => { setShowSched(true);   setShowMore(false); } },
              { icon: "🎯", label: "Word Game",action: () => { setShowGame(true);    setShowMore(false); } },
              { icon: "🎤", label: "Voice",    action: () => { setShowVoice(true);   setShowMore(false); } },
            ].map(({ icon, label, action }) => (
              <button key={label} onClick={action}
                className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <span className="text-2xl">{icon}</span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-2.5">
        <button onClick={() => setShowEmoji((v) => !v)} title="Emoji"
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 text-lg leading-none">😊</button>

        <button onClick={() => setShowMore((v) => !v)} title="More features"
          className={`p-2 rounded-xl transition-colors flex-shrink-0 font-bold text-base leading-none
            ${showMore ? "bg-brand-500 text-white" : "text-slate-500 dark:text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>+</button>

        <button onClick={() => fileRef.current?.click()} disabled={uploading} title="Attach file"
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 text-lg leading-none disabled:opacity-50">
          {uploading ? "⏳" : "📎"}
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx,.txt" />

        <textarea ref={inputRef} value={text} onChange={handleChange} onKeyDown={handleKeyDown}
          placeholder={replyTo ? `Replying to ${replyTo.sender?.username}…` : "Type a message… (Enter to send)"}
          rows={1}
          className="flex-1 resize-none px-4 py-2.5 rounded-2xl text-sm
            bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
            text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
            transition-all scrollbar-hide"
          style={{ minHeight: "42px", maxHeight: "128px" }}
        />

        <button onClick={handleSend} disabled={!text.trim()} title="Send (Enter)"
          className="p-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl shadow-sm transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>

      {showVanish && <VanishMessage    onClose={() => setShowVanish(false)} />}
      {showSched  && <MessageScheduler onClose={() => setShowSched(false)}  />}
      {showGame   && <WordGameWidget   onClose={() => setShowGame(false)}   />}
      {showVoice  && <VoiceRecorder    onClose={() => setShowVoice(false)}  />}
    </div>
  );
};

export default MessageInput;