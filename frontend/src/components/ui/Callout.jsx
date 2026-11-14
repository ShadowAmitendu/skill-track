import { Callout as BpCallout, Intent } from "@blueprintjs/core";

const variantIntentMap = {
  danger: Intent.DANGER,
  warning: Intent.WARNING,
  info: Intent.PRIMARY,
  success: Intent.SUCCESS,
  neutral: Intent.NONE,
};

/**
 * @param {object} props
 * @param {any} [props.children]
 * @param {"info"|"success"|"warning"|"danger"|"neutral"} [props.variant]
 * @param {string} [props.title]
 * @param {any} [props.icon]
 * @param {boolean} [props.compact]
 * @param {boolean} [props.minimal]
 * @param {string} [props.className]
 */
export function Callout({
  children,
  variant = "neutral",
  title,
  icon,
  compact = false,
  minimal = false,
  className = "",
  ...props
}) {
  return (
    <BpCallout
      intent={variantIntentMap[variant] || Intent.NONE}
      title={title}
      icon={icon}
      compact={compact}
      minimal={minimal}
      className={`text-xs ${className}`.trim()}
      {...props}
    >
      {children}
    </BpCallout>
  );
}
