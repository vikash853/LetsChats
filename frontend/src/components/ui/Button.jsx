import Spinner from "./Spinner";

const variants = {
  primary:   "bg-brand-500 hover:bg-brand-600 text-white shadow-sm",
  secondary: "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200",
  ghost:     "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400",
  danger:    "bg-red-500 hover:bg-red-600 text-white",
};

const Button = ({ children, loading = false, variant = "primary", className = "", ...props }) => (
  <button
    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5
      rounded-xl font-medium text-sm transition-all
      focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1
      disabled:opacity-50 disabled:cursor-not-allowed
      ${variants[variant]} ${className}`}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading && <Spinner size="sm" />}
    {children}
  </button>
);

export default Button;
