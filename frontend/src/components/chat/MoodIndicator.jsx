/**
 * MoodIndicator — Fixed version
 * Shows mood badge in chat header based on recent messages
 */

const MOODS = [
  {
    name: "😄 Vibing",
    color: "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-500/40",
    test: (t) => /😂|😆|🤣|lol|haha|hehe|funny|amazing|awesome|great|love|happy|yay|wow/i.test(t),
  },
  {
    name: "❤️ Warm",
    color: "bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-500/40",
    test: (t) => /❤|💕|💖|love|miss|care|sweet|hug|kiss|cute|dear|baby/i.test(t),
  },
  {
    name: "😢 Sad",
    color: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/40",
    test: (t) => /😢|😭|sad|cry|hurt|pain|sorry|bad day|depressed|awful|terrible|miss you/i.test(t),
  },
  {
    name: "😤 Heated",
    color: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/40",
    test: (t) => /😤|😠|angry|mad|upset|frustrated|annoying|stop it|hate|ugh|shut up/i.test(t),
  },
  {
    name: "🤔 Deep talk",
    color: "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/40",
    test: (t) => /think|feel|maybe|wonder|believe|opinion|understand|honestly|actually|life|truth/i.test(t),
  },
  {
    name: "💼 Business",
    color: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-500",
    test: (t) => /meeting|work|project|deadline|task|call|email|office|client|report|job/i.test(t),
  },
  {
    name: "💬 Chatting",
    color: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40",
    test: () => true, // default fallback
  },
];

const MoodIndicator = ({ messages }) => {
  if (!messages || messages.length < 2) return null;

  // Analyse last 15 messages
  const recent = messages.slice(-15);
  const text = recent.map((m) => m.content || "").join(" ");

  // Find first matching mood (ordered by specificity)
  const mood = MOODS.find((m) => m.test(text));
  if (!mood || mood.name === "💬 Chatting") return null; // hide default

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${mood.color}`}>
      {mood.name}
    </span>
  );
};

export default MoodIndicator;