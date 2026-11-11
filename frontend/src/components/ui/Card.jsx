import {
  Card as BpCard,
  CardList as BpCardList,
  Elevation,
  H5,
  Section as BpSection,
  SectionCard as BpSectionCard,
} from "@blueprintjs/core";

export { Elevation };

/**
 * @param {object} props
 * @param {any} [props.children]
 * @param {string} [props.className]
 * @param {boolean} [props.interactive]
 * @param {any} [props.elevation]
 * @param {boolean} [props.compact]
 * @param {boolean} [props.selected]
 * @param {(e: any) => void} [props.onClick]
 * @param {(e: any) => void} [props.onKeyDown]
 * @param {string} [props.role]
 * @param {number} [props.tabIndex]
 */
export function Card({
  elevation = Elevation.ONE,
  interactive = false,
  selected = false,
  compact = false,
  className = "",
  children,
  ...props
}) {
  return (
    <BpCard
      elevation={elevation}
      interactive={interactive}
      selected={selected}
      compact={compact}
      className={className}
      {...props}
    >
      {children}
    </BpCard>
  );
}

/**
 * @param {object} props
 * @param {any} [props.children]
 * @param {any} [props.title]
 * @param {any} [props.subtitle]
 * @param {any} [props.icon]
 * @param {any} [props.rightElement]
 * @param {boolean} [props.compact]
 * @param {boolean} [props.collapsible]
 * @param {any} [props.collapseProps]
 * @param {any} [props.elevation]
 * @param {string} [props.className]
 */
export function Section({ elevation = Elevation.ONE, ...props }) {
  return <BpSection elevation={elevation} {...props} />;
}

/**
 * @param {object} props
 * @param {any} [props.children]
 * @param {boolean} [props.padded]
 * @param {boolean} [props.compact]
 * @param {string} [props.className]
 */
export function SectionCard({ padded = true, compact: _compact = false, ...props }) {
  return <BpSectionCard padded={padded} {...props} />;
}

export function CardList({ bordered = true, ...props }) {
  return <BpCardList bordered={bordered} {...props} />;
}

export function CardHeader({ className = "", children, ...props }) {
  return (
    <div
      className={`pb-3 mb-4 border-b border-black/10 dark:border-white/10 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }) {
  return (
    <H5 className={`!mb-0 ${className}`.trim()} {...props}>
      {children}
    </H5>
  );
}

export function CardDescription({ className = "", children, ...props }) {
  return (
    <p className={`bp6-text-muted text-xs mt-1 ${className}`.trim()} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = "", children, ...props }) {
  return (
    <div
      className={`pt-3 mt-4 border-t border-black/10 dark:border-white/10 flex items-center gap-2 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
