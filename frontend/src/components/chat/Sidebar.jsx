import { useState, useEffect } from "react";
import { useAuth }  from "../../context/AuthContext";
import { useChat }  from "../../context/ChatContext";
import { useTheme } from "../../hooks/useTheme";
import { useDebounce } from "../../hooks/useDebounce";
import { usersAPI, conversationsAPI } from "../../services/api";
import Avatar  from "../ui/Avatar";
import Spinner from "../ui/Spinner";
import UserProfileModal from "./UserProfileModal";
import { parseVanish }  from "./VanishMessage";
import {
  getConversationName, getOtherParticipant,
  truncate, formatConversationDate,
} from "../../utils/helpers";

const Sidebar = () => {
  const { user, logout }        = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const {
    conversations, activeConversation, onlineUsers,
    selectConversation, notifications, fetchConversations,
  } = useChat();

  const [tab,           setTab]           = useState("chats");
  const [search,        setSearch]        = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching,     setSearching]     = useState(false);
  const [showProfile,   setShowProfile]   = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    if (!debouncedSearch.trim()) { setSearchResults([]); return; }
    setSearching(true);
    usersAPI.getAll(debouncedSearch)
      .then(({ data }) => setSearchResults(data.users))
      .catch(() => {})
      .finally(() => setSearching(false));
  }, [debouncedSearch]);

  const handleStartChat = async (targetUser) => {
    try {
      const { data } = await conversationsAPI.accessOrCreate(targetUser._id);
      await fetchConversations();
      setSearch(""); setSearchResults([]);
      selectConversation(data.conversation);
    } catch (err) { console.error("handleStartChat:", err.message); }
  };

  // Clean preview — handles vanish, image, file, normal text
  const getPreview = (conv) => {
    if (!conv.lastMessage) return "No messages yet";
    const { messageType, content } = conv.lastMessage;
    if (messageType === "image") return "📷  Photo";
    if (messageType === "file")  return "📎  File";
    if (content?.startsWith("__VANISH__")) {
      const v = parseVanish(content);
      return v ? `💣  ${truncate(v.text, 30)}` : "💣  Vanish message";
    }
    return truncate(content || "", 38);
  };

  return (
    <>
      <aside className="w-full flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 h-full">

        {/* User bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <button onClick={() => setShowProfile(true)}
            className="flex items-center gap-2.5 min-w-0 group" title="Edit your profile">
            <div className="relative">
              <Avatar user={user} size="sm" showOnline isOnline />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15H9v-2z"/>
                </svg>
              </span>
            </div>
            <div className="min-w-0 text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-500 transition-colors">{user?.username}</p>
              <p className="text-[11px] text-emerald-500 font-medium">Online</p>
            </div>
          </button>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={toggleTheme} title="Toggle theme"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-base leading-none">
              {isDark ? "☀️" : "🌙"}
            </button>
            <button onClick={logout} title="Sign out"
              className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2.5">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people…"
              className="w-full pl-9 pr-8 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800
                text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
                border border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"/>
            {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Spinner size="sm"/></div>}
            {search && !searching && (
              <button onClick={() => { setSearch(""); setSearchResults([]); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            )}
          </div>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mx-3 mb-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden z-10 max-h-52 overflow-y-auto">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 pt-2 pb-1">Results</p>
            {searchResults.map((u) => (
              <button key={u._id} onClick={() => handleStartChat(u)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-left">
                <Avatar user={u} size="sm" showOnline isOnline={onlineUsers.includes(u._id)}/>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{u.username}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-3 flex-shrink-0">
          {[
            { id: "chats",  label: "Chats",  count: conversations.length },
            { id: "online", label: "Online", count: onlineUsers.length   },
          ].map(({ id, label, count }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px
                ${tab === id ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}>
              {label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                ${tab === id ? "bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === "chats" && (
            conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
                <span className="text-3xl">🔍</span>
                <p className="text-sm text-slate-400 dark:text-slate-500">Search for a user above to start your first chat</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const name     = getConversationName(conv, user._id);
                const other    = !conv.isGroup ? getOtherParticipant(conv, user._id) : null;
                const isActive = activeConversation?._id === conv._id;
                const unread   = notifications[conv._id] || 0;
                const isOnline = other ? onlineUsers.includes(other._id) : false;
                return (
                  <button key={conv._id} onClick={() => selectConversation(conv)}
                    className={`w-full flex items-center gap-3 px-3 py-3 transition-colors text-left
                      ${isActive ? "bg-brand-50 dark:bg-brand-500/10 border-r-2 border-brand-500" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}>
                    <Avatar user={other || { username: conv.groupName }} size="md" showOnline={!conv.isGroup} isOnline={isOnline}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-900 dark:text-slate-100"}`}>{name}</p>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {conv.updatedAt ? formatConversationDate(conv.updatedAt) : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{getPreview(conv)}</p>
                        {unread > 0 && (
                          <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )
          )}

          {tab === "online" && (
            onlineUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
                <span className="text-3xl">🌐</span>
                <p className="text-sm text-slate-400 dark:text-slate-500">No other users online right now</p>
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {onlineUsers.map((uid) => {
                  const conv = conversations.find((c) => !c.isGroup && c.participants.some((p) => p._id === uid));
                  const onlineUser = conv?.participants.find((p) => p._id === uid);
                  if (!onlineUser) return null;
                  return (
                    <button key={uid} onClick={() => conv && selectConversation(conv)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                      <Avatar user={onlineUser} size="sm" showOnline isOnline/>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{onlineUser.username}</p>
                        <p className="text-[11px] text-emerald-500">Active now</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>
      </aside>

      {showProfile && <UserProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );
};

export default Sidebar;