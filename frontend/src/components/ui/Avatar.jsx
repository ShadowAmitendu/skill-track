/** @param {{ src?: string, alt?: string, fallback?: string, size?: "sm" | "md" | "lg" | "xl" | string, className?: string, [key: string]: any }} props */
export function Avatar({
  src,
  alt = "",
  fallback = "",
  size = "md",
  className = "",
  ...props
}) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-14 h-14 text-lg",
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden bg-[#1c2127] text-[#f6f7f9] font-medium border border-[#5f6b7c]/30 dark:bg-[#383e47] dark:border-white/25 align-middle select-none uppercase ${
        sizes[size] || sizes.md
      } ${className}`}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span>{fallback ? getInitials(fallback) : "?"}</span>
      )}
    </span>
  );
}
