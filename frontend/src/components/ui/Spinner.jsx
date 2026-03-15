const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };

const Spinner = ({ size = "md", className = "" }) => (
  <div
    className={`${sizes[size]} ${className} animate-spin rounded-full
      border-2 border-slate-200 dark:border-slate-700 border-t-brand-500`}
  />
);

export default Spinner;
