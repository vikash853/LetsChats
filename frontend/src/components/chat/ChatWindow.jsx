import { useEffect, useRef, useState } from "react";
import { useChat }        from "../../context/ChatContext";
import { useAuth }        from "../../context/AuthContext";
import MessageBubble      from "./MessageBubble";
import MessageInput       from "./MessageInput";
import Avatar             from "../ui/Avatar";
import Spinner            from "../ui/Spinner";
import MoodIndicator      from "./MoodIndicator";
import ChatAnalytics      from "./ChatAnalytics";
import SearchMessages     from "./SearchMessages";
import { getConversationName, getOtherParticipant, formatLastSeen } from "../../utils/helpers";
import { format, isToday, isYesterday, isSameDay } from "date-fns";

const DateSeparator = ({ date }) => {
  const d = new Date(date);
  const label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMMM d, yyyy");
  return (
    <div className="flex items-center gap-3 my-4 select-none">
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 px-2">{label}</span>
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
    </div>
  );
};

const TypingIndicator = ({ names }) => (
  <div className="flex items-end gap-2 mb-1 animate-fade-in">
    <div className="w-8 flex-shrink-0" />
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-[11px] text-slate-400 ml-1">{names} is typing…</span>
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-2.5">
        <div className="flex gap-1 items-center h-4">
          {[0,1,2].map((i) => (
            <span key={i} className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse-dot"
              style={{ animationDelay: `${i * 0.16}s` }} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ProfilePanel = ({ profileUser, isOnline, onClose }) => (
  <div className="w-72 flex-shrink-0 flex flex-col border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 animate-slide-up overflow-y-auto">
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
      <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Profile info</h3>
      <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
    <div className="flex flex-col items-center px-6 pt-8 pb-4 gap-3">
      <Avatar user={profileUser} size="xl" showOnline isOnline={isOnline} />
      <div className="text-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{profileUser.username}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{profileUser.email}</p>
      </div>
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
        ${isOnline ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-slate-400"}`} />
        {isOnline ? "Active now" : `Last seen ${formatLastSeen(profileUser.lastSeen)}`}
      </span>
    </div>
    {profileUser.bio ? (
      <div className="mx-4 mb-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bio</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">"{profileUser.bio}"</p>
      </div>
    ) : (
      <div className="mx-4 mb-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
        <p className="text-sm text-slate-400 italic">No bio yet</p>
      </div>
    )}
    <div className="mx-4 space-y-2 pb-4">
      {[
        { emoji: "📧", label: "Email",        value: profileUser.email },
        { emoji: "📅", label: "Member since", value: profileUser.createdAt ? format(new Date(profileUser.createdAt), "MMMM d, yyyy") : "Unknown" },
        { emoji: isOnline ? "🟢" : "🔴", label: "Status", value: isOnline ? "Online now" : "Away" },
      ].map(({ emoji, label, value }) => (
        <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
          <span className="text-lg">{emoji}</span>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{value}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ChatWindow = ({ onBack }) => {
  const { user } = useAuth();
  const { activeConversation, messages, typingUsers, loadingMessages, onlineUsers } = useChat();

  const bottomRef       = useRef(null);
  const scrollRef       = useRef(null);
  const messageRefs     = useRef({});

  const [showProfile,   setShowProfile]   = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSearch,    setShowSearch]    = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [replyTo,       setReplyTo]       = useState(null);

  const other       = activeConversation && !activeConversation.isGroup ? getOtherParticipant(activeConversation, user._id) : null;
  const isOnline    = other ? onlineUsers.includes(other._id) : false;
  const name        = activeConversation ? getConversationName(activeConversation, user._id) : "";
  const typingNames = Object.values(typingUsers).join(", ");

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typingUsers]);
  useEffect(() => { setReplyTo(null); }, [activeConversation?._id]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 300);
  };

  // Jump to a specific message by ID (from search)
  const handleJumpTo = (messageId) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-brand-50", "dark:bg-brand-500/10");
      setTimeout(() => el.classList.remove("bg-brand-50", "dark:bg-brand-500/10"), 2000);
    }
  };

  const renderMessages = () => {
    const items = [];
    messages.forEach((msg, idx) => {
      const prev = messages[idx - 1];
      if (!prev || !isSameDay(new Date(msg.createdAt), new Date(prev.createdAt))) {
        items.push(<DateSeparator key={"sep-" + msg._id} date={msg.createdAt} />);
      }
      const showAvatar = !prev || prev.sender._id !== msg.sender._id || !isSameDay(new Date(msg.createdAt), new Date(prev.createdAt));
      items.push(
        <div key={msg._id} ref={(el) => { if (el) messageRefs.current[msg._id] = el; }} className="rounded-xl transition-colors duration-500">
          <MessageBubble message={msg} showAvatar={showAvatar} onReply={setReplyTo} />
        </div>
      );
    });
    return items;
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-4 select-none hidden md:flex">
        <div className="w-20 h-20 bg-brand-50 dark:bg-brand-500/10 rounded-3xl flex items-center justify-center text-4xl">💬</div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Select a conversation</h2>
          <p className="text-sm text-slate-400 mt-1">Search for someone to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-w-0 min-h-0 overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0 min-h-0 bg-slate-50 dark:bg-slate-900 relative">

        {/* Header */}
        <div className="flex items-center gap-3 px-3 md:px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0">
          {onBack && (
            <button onClick={onBack} className="md:hidden p-1.5 -ml-1 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
          )}
          <Avatar user={other || { username: activeConversation.groupName }}
            size="md" showOnline={!activeConversation.isGroup} isOnline={isOnline} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm md:text-base">{name}</h3>
              <MoodIndicator messages={messages} />
            </div>
            <p className="text-xs mt-0.5">
              {activeConversation.isGroup
                ? <span className="text-slate-500">{activeConversation.participants.length} members</span>
                : isOnline
                  ? <span className="text-emerald-500 font-medium">Online</span>
                  : <span className="text-slate-400">Last seen {formatLastSeen(other?.lastSeen)}</span>
              }
            </p>
          </div>

          {/* Search button */}
          <button onClick={() => setShowSearch(true)} title="Search messages"
            className="p-2 rounded-xl text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
            </svg>
          </button>

          {/* Analytics button */}
          <button onClick={() => setShowAnalytics(true)} title="Chat stats"
            className="p-2 rounded-xl text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </button>

          {!activeConversation.isGroup && (
            <button onClick={() => setShowProfile((v) => !v)} title="View profile"
              className={`hidden sm:flex p-2 rounded-xl transition-colors
                ${showProfile ? "bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400" : "text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="8" r="4"/><path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-3 md:px-4 py-4 relative">
          {loadingMessages ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-3xl">👋</div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300">Say hello to {name}!</p>
                <p className="text-sm text-slate-400 mt-1">Start the conversation</p>
              </div>
            </div>
          ) : (
            <>
              {renderMessages()}
              {typingNames && <TypingIndicator names={typingNames} />}
            </>
          )}
          <div ref={bottomRef} />
          {showScrollBtn && (
            <button onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="absolute bottom-4 right-4 w-10 h-10 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all animate-fade-in">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
          )}
        </div>

        <MessageInput replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />

        {/* Search overlay */}
        {showSearch && (
          <SearchMessages
            messages={messages}
            onClose={() => setShowSearch(false)}
            onJumpTo={handleJumpTo}
          />
        )}
      </div>

      {showProfile && other && (
        <div className="hidden sm:block">
          <ProfilePanel profileUser={other} isOnline={isOnline} onClose={() => setShowProfile(false)} />
        </div>
      )}
      {showAnalytics && <ChatAnalytics messages={messages} onClose={() => setShowAnalytics(false)} />}
    </div>
  );
};

export default ChatWindow;