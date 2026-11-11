export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }) {
  return (
    <div
      className={`px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", ...props }) {
  return (
    <h3 className={`text-sm font-semibold text-gray-900 dark:text-gray-50 ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "", ...props }) {
  return (
    <p className={`text-xs text-gray-500 dark:text-gray-400 mt-0.5 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "", ...props }) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", ...props }) {
  return (
    <div
      className={`px-5 py-3.5 bg-gray-50 border-t border-gray-200 rounded-b-lg dark:bg-gray-950/60 dark:border-gray-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
