import { HTMLTable } from "@blueprintjs/core";

/** @param {{ children?: any, className?: string, interactive?: boolean, bordered?: boolean, striped?: boolean, compact?: boolean, [key: string]: any }} props */
export function Table({
  children,
  className = "",
  interactive = true,
  bordered = false,
  striped = false,
  compact = false,
  ...props
}) {
  return (
    <div className="max-w-full overflow-x-auto">
      <HTMLTable
        interactive={interactive}
        bordered={bordered}
        striped={striped}
        compact={compact}
        className={`w-full text-left ${className}`.trim()}
        {...props}
      >
        {children}
      </HTMLTable>
    </div>
  );
}
