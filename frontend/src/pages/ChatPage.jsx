/**
 * ChatPage — Fully responsive
 * Mobile:  Shows sidebar OR chat (not both) — tap conversation to open, back arrow to return
 * Tablet:  Side by side (narrower sidebar)
 * Desktop: Full split layout
 */
import { useState, useEffect } from "react";
import Sidebar    from "../components/chat/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import { useChat } from "../context/ChatContext";

const ChatPage = () => {
  const { activeConversation } = useChat();
  const [showChat, setShowChat] = useState(false);

  // When a conversation is selected on mobile, switch to chat view
  useEffect(() => {
    if (activeConversation) setShowChat(true);
  }, [activeConversation]);

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-900">

      {/* ── Sidebar ──────────────────────────────────────────────
          Mobile:  full screen, hidden when chat is open
          Desktop: fixed 288px width, always visible            */}
      <div className={`
        ${showChat ? "hidden" : "flex"} md:flex
        w-full md:w-72 flex-shrink-0 flex-col
      `}>
        <Sidebar />
      </div>

      {/* ── Chat window ──────────────────────────────────────────
          Mobile:  full screen, shown when chat is open
          Desktop: fills remaining space                        */}
      <div className={`
        ${showChat ? "flex" : "hidden"} md:flex
        flex-1 flex-col min-w-0
      `}>
        <ChatWindow onBack={() => setShowChat(false)} />
      </div>
    </div>
  );
};

export default ChatPage;