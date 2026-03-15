/**
 * Helper Utilities
 * Pure functions used across the whole frontend.
 */
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";

/** Format a message timestamp: "3:45 PM" */
export const formatMessageTime = (date) =>
  format(new Date(date), "h:mm a");

/** Format date for conversation list sidebar */
export const formatConversationDate = (date) => {
  const d = new Date(date);
  if (isToday(d))     return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
};

/** "last seen 5 minutes ago" */
export const formatLastSeen = (date) => {
  if (!date) return "a while ago";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

/** "Alice Bob" → "AB" */
export const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

/**
 * Get the display name for a conversation:
 * - Private chat → the OTHER user's username
 * - Group chat   → the group's name
 */
export const getConversationName = (conversation, currentUserId) => {
  if (conversation.isGroup) return conversation.groupName;
  const other = conversation.participants.find((p) => p._id !== currentUserId);
  return other?.username || "Unknown";
};

/** Get the other participant object in a 1-on-1 conversation */
export const getOtherParticipant = (conversation, currentUserId) =>
  conversation.participants.find((p) => p._id !== currentUserId);

/** Truncate a string with ellipsis */
export const truncate = (str = "", len = 40) =>
  str.length > len ? str.slice(0, len) + "…" : str;

/**
 * Deterministic color from a string — used for avatar backgrounds.
 * Same username always maps to the same color.
 */
export const stringToColor = (str = "") => {
  const palette = [
    "#4f46e5", "#0891b2", "#0d9488", "#16a34a",
    "#ca8a04", "#ea580c", "#dc2626", "#9333ea", "#db2777",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};
