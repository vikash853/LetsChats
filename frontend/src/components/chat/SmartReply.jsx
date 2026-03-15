/**
 * SmartReply
 * Analyses the last message received and suggests 3 quick replies.
 * Uses pattern matching — no external API needed.
 * Appears above the input bar when the last message is from the other person.
 */

const REPLY_MAP = [
  { patterns: [/\bhow are you\b/i, /\bhow r u\b/i, /\bwhats up\b/i, /\bwhat's up\b/i],
    replies: ["I'm doing great, thanks! 😊", "All good here! You?", "Pretty busy but good!"] },
  { patterns: [/\bhello\b/i, /\bhi\b/i, /\bhey\b/i, /\bhiya\b/i],
    replies: ["Hey! 👋", "Hi there!", "Hello! How's it going?"] },
  { patterns: [/\bthank(s| you)\b/i, /\bthx\b/i, /\bty\b/i],
    replies: ["You're welcome! 😊", "Anytime!", "No problem at all!"] },
  { patterns: [/\bsorry\b/i, /\bmy bad\b/i, /\bapologi/i],
    replies: ["No worries!", "It's okay 😊", "All good, don't worry!"] },
  { patterns: [/\?$/],
    replies: ["Yes, definitely!", "Not sure, let me think…", "Good question!"] },
  { patterns: [/\bgood morning\b/i, /\bgm\b/i],
    replies: ["Good morning! ☀️", "Morning! Hope you slept well!", "Good morning! 😊"] },
  { patterns: [/\bgood night\b/i, /\bgn\b/i, /\bnight\b/i],
    replies: ["Good night! 🌙", "Sweet dreams!", "Night! Talk tomorrow 👋"] },
  { patterns: [/\blove\b/i, /\b❤️\b/, /\b😍\b/],
    replies: ["Aww ❤️", "Love you too! 💕", "😊❤️"] },
  { patterns: [/\b(ok|okay|sure|alright)\b/i],
    replies: ["Great!", "Perfect 👍", "Sounds good!"] },
  { patterns: [/\bbusy\b/i, /\bcan'?t talk\b/i],
    replies: ["No worries, talk later!", "Okay, ping me when free!", "Sure, take your time 😊"] },
];

const DEFAULT_REPLIES = ["Got it! 👍", "Okay!", "Sounds good!"];

export const getSmartReplies = (messageText) => {
  if (!messageText) return DEFAULT_REPLIES;
  for (const { patterns, replies } of REPLY_MAP) {
    if (patterns.some((p) => p.test(messageText))) return replies;
  }
  return DEFAULT_REPLIES;
};

const SmartReply = ({ lastMessage, onSelect, currentUserId }) => {
  // Only show for messages from the other person
  if (!lastMessage || lastMessage.sender._id === currentUserId) return null;
  if (lastMessage.messageType !== "text") return null;

  const suggestions = getSmartReplies(lastMessage.content);

  return (
    <div className="px-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
      <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center flex-shrink-0 font-medium uppercase tracking-wide">
        Quick reply:
      </span>
      {suggestions.map((reply, i) => (
        <button
          key={i}
          onClick={() => onSelect(reply)}
          className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full
            bg-brand-50 dark:bg-brand-500/10
            text-brand-600 dark:text-brand-400
            border border-brand-200 dark:border-brand-500/30
            hover:bg-brand-100 dark:hover:bg-brand-500/20
            transition-colors whitespace-nowrap"
        >
          {reply}
        </button>
      ))}
    </div>
  );
};

export default SmartReply;