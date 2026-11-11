import { Avatar as BaseAvatar } from "@base-ui/react/avatar";

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
    <BaseAvatar.Root
      className={`inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 align-middle select-none ${
        sizes[size] || sizes.md
      } ${className}`}
      {...props}
    >
      {src && (
        <BaseAvatar.Image
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      )}
      <BaseAvatar.Fallback className="flex h-full w-full items-center justify-center bg-gray-900 font-medium text-gray-50 uppercase dark:bg-gray-700 dark:text-gray-50">
        {fallback ? getInitials(fallback) : "?"}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
