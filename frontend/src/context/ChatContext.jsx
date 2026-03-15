import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef,
} from "react";
import { conversationsAPI, messagesAPI } from "../services/api";
import { getSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

const ChatContext = createContext(null);
const SCHEDULED_KEY = "chatapp_scheduled";

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations,      setConversations]      = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages,           setMessages]           = useState([]);
  const [onlineUsers,        setOnlineUsers]        = useState([]);
  const [typingUsers,        setTypingUsers]        = useState({});
  const [loadingMessages,    setLoadingMessages]    = useState(false);
  const [notifications,      setNotifications]      = useState({});
  const typingTimers     = useRef({});
  const conversationsRef = useRef([]);
  const sentMessageIds   = useRef(new Set());
  const schedulerRef     = useRef(null);

  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await conversationsAPI.getAll();
      setConversations(data.conversations);
      return data.conversations;
    } catch (err) { console.error("fetchConversations:", err.message); return []; }
  }, []);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  const sendMessage = useCallback(async (content, messageType = "text", fileUrl = null, fileName = null) => {
    const conv = activeConversation || conversationsRef.current[0];
    if (!conv) return;
    try {
      const { data } = await messagesAPI.send({ conversationId: conv._id, content, messageType, fileUrl, fileName });
      const newMsg = data.message;
      sentMessageIds.current.add(newMsg._id);
      setMessages((prev) => [...prev, newMsg]);
      setConversations((prev) =>
        prev.map((c) => c._id === conv._id ? { ...c, lastMessage: newMsg, updatedAt: new Date() } : c)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
      const socket = getSocket();
      if (socket) socket.emit("message:send", { conversationId: conv._id, message: newMsg });
      return newMsg;
    } catch (err) { console.error("sendMessage:", err.message); }
  }, [activeConversation]);

  // ── Scheduled message runner ────────────────────────────────
  // Checks localStorage every 10s and fires any due messages
  useEffect(() => {
    if (!user || !activeConversation) return;

    const runScheduler = () => {
      const items = JSON.parse(localStorage.getItem(SCHEDULED_KEY) || "[]");
      if (items.length === 0) return;
      const now = Date.now();
      const remaining = [];
      items.forEach((item) => {
        if (now >= item.sendAt) {
          // Send to current active conversation
          messagesAPI.send({
            conversationId: activeConversation._id,
            content: `⏰ ${item.text}`,
            messageType: "text",
          }).then(({ data }) => {
            const newMsg = data.message;
            sentMessageIds.current.add(newMsg._id);
            setMessages((prev) => [...prev, newMsg]);
            setConversations((prev) =>
              prev.map((c) => c._id === activeConversation._id
                ? { ...c, lastMessage: newMsg, updatedAt: new Date() } : c)
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            );
            const socket = getSocket();
            if (socket) socket.emit("message:send", { conversationId: activeConversation._id, message: newMsg });
          }).catch(() => {});
        } else {
          remaining.push(item);
        }
      });
      localStorage.setItem(SCHEDULED_KEY, JSON.stringify(remaining));
    };

    // Run immediately on conversation open, then every 10s
    runScheduler();
    schedulerRef.current = setInterval(runScheduler, 10000);
    return () => clearInterval(schedulerRef.current);
  }, [activeConversation, user]);

  const selectConversation = useCallback(async (conversation) => {
    if (!conversation?._id) return;
    const full = conversationsRef.current.find((c) => c._id === conversation._id);
    setActiveConversation(full || conversation);
    const socket = getSocket();
    if (socket) socket.emit("join:conversation", conversation._id);
    setLoadingMessages(true);
    try {
      const { data } = await messagesAPI.getByConversation(conversation._id);
      setMessages(data.messages);
      await messagesAPI.markRead(conversation._id);
      setNotifications((prev) => ({ ...prev, [conversation._id]: 0 }));
      if (socket) socket.emit("message:read", { conversationId: conversation._id, readBy: user._id });
    } catch (err) { console.error("loadMessages:", err.message); }
    finally { setLoadingMessages(false); }
  }, [user]);

  const startTyping = useCallback(() => {
    const socket = getSocket();
    if (socket && activeConversation) socket.emit("typing:start", { conversationId: activeConversation._id, username: user.username });
  }, [activeConversation, user]);

  const stopTyping = useCallback(() => {
    const socket = getSocket();
    if (socket && activeConversation) socket.emit("typing:stop", { conversationId: activeConversation._id });
  }, [activeConversation]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const onMessage = (message) => {
      if (sentMessageIds.current.has(message._id)) { sentMessageIds.current.delete(message._id); return; }
      const cid = message.conversationId;
      setActiveConversation((active) => {
        if (active && active._id === cid) {
          setMessages((prev) => [...prev, message]);
          messagesAPI.markRead(cid).catch(() => {});
          socket.emit("message:read", { conversationId: cid, readBy: user._id });
        } else {
          setNotifications((prev) => ({ ...prev, [cid]: (prev[cid] || 0) + 1 }));
        }
        return active;
      });
      setConversations((prev) =>
        prev.map((c) => c._id === cid ? { ...c, lastMessage: message, updatedAt: new Date() } : c)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    };

    const onUserOnline  = ({ userId }) => setOnlineUsers((p) => [...new Set([...p, userId])]);
    const onUserOffline = ({ userId }) => setOnlineUsers((p) => p.filter((id) => id !== userId));
    const onOnlineList  = (ids)        => setOnlineUsers(ids);

    const onTypingStart = ({ userId: uid, username }) => {
      setTypingUsers((p) => ({ ...p, [uid]: username }));
      clearTimeout(typingTimers.current[uid]);
      typingTimers.current[uid] = setTimeout(() => {
        setTypingUsers((p) => { const n = { ...p }; delete n[uid]; return n; });
      }, 3000);
    };
    const onTypingStop = ({ userId: uid }) => {
      clearTimeout(typingTimers.current[uid]);
      setTypingUsers((p) => { const n = { ...p }; delete n[uid]; return n; });
    };

    socket.on("message:received",  onMessage);
    socket.on("user:online",       onUserOnline);
    socket.on("user:offline",      onUserOffline);
    socket.on("users:online-list", onOnlineList);
    socket.on("typing:start",      onTypingStart);
    socket.on("typing:stop",       onTypingStop);

    return () => {
      socket.off("message:received",  onMessage);
      socket.off("user:online",       onUserOnline);
      socket.off("user:offline",      onUserOffline);
      socket.off("users:online-list", onOnlineList);
      socket.off("typing:start",      onTypingStart);
      socket.off("typing:stop",       onTypingStop);
    };
  }, [user]);

  return (
    <ChatContext.Provider value={{
      conversations, activeConversation, messages,
      onlineUsers, typingUsers, loadingMessages, notifications,
      fetchConversations, selectConversation, sendMessage,
      startTyping, stopTyping, setMessages,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
};