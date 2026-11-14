import { Intent, Tag } from "@blueprintjs/core";

const intentMap = {
  default: Intent.NONE,
  secondary: Intent.NONE,
  outline: Intent.NONE,
  primary: Intent.PRIMARY,
  blue: Intent.PRIMARY,
  sky: Intent.PRIMARY,
  indigo: Intent.PRIMARY,
  success: Intent.SUCCESS,
  emerald: Intent.SUCCESS,
  teal: Intent.SUCCESS,
  warning: Intent.WARNING,
  amber: Intent.WARNING,
  danger: Intent.DANGER,
  rose: Intent.DANGER,
};

/**
 * @param {object} props
 * @param {any} [props.children]
 * @param {"default"|"neutral"|"secondary"|"primary"|"info"|"success"|"warning"|"danger"|"outline"|"emerald"|"amber"|"rose"|string} [props.variant]
 * @param {string} [props.className]
 * @param {any} [props.icon]
 * @param {any} [props.endIcon]
 * @param {boolean} [props.minimal]
 * @param {boolean} [props.round]
 */
export function Badge({
  children,
  variant = "default",
  minimal,
  round = false,
  icon,
  endIcon,
  className = "",
  ...props
}) {
  const intent = intentMap[variant] || Intent.NONE;
  const isMinimal =
    minimal !== undefined ? minimal : variant !== "default";

  return (
    <Tag
      intent={intent}
      minimal={isMinimal}
      round={round}
      icon={icon}
      endIcon={endIcon}
      className={className}
      {...props}
    >
      {children}
    </Tag>
  );
}
