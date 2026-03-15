const Input = ({ label, error, className = "", ...props }) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
    )}
    <input
      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all
        bg-white dark:bg-slate-800
        text-slate-900 dark:text-slate-100
        placeholder-slate-400 dark:placeholder-slate-500
        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
        ${error
          ? "border-red-400 dark:border-red-500 focus:ring-red-400"
          : "border-slate-200 dark:border-slate-700"
        }
        ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

export default Input;
