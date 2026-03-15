/**
 * Avatar
 * Shows profile image, or a colored initial-letter fallback.
 * Optional green online dot (showOnline + isOnline props).
 */
import { getInitials, stringToColor } from "../../utils/helpers";

const sizes = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
};
const dotSizes = {
  xs: "w-1.5 h-1.5 border",
  sm: "w-2 h-2 border",
  md: "w-2.5 h-2.5 border-2",
  lg: "w-3 h-3 border-2",
  xl: "w-3.5 h-3.5 border-2",
};

const Avatar = ({ user, size = "md", showOnline = false, isOnline = false }) => {
  const name = user?.username || user?.groupName || "?";
  const bg   = stringToColor(name);

  return (
    <div className="relative inline-block flex-shrink-0">
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={name}
          className={`${sizes[size]} rounded-full object-cover ring-2 ring-white dark:ring-slate-800`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white dark:ring-slate-800`}
          style={{ backgroundColor: bg }}
        >
          {getInitials(name)}
        </div>
      )}

      {showOnline && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-white dark:border-slate-800
            ${dotSizes[size]}
            ${isOnline ? "bg-emerald-400" : "bg-slate-300 dark:bg-slate-600"}`}
        />
      )}
    </div>
  );
};

export default Avatar;
