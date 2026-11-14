import { Intent, ProgressBar } from "@blueprintjs/core";

const intentMap = {
  default: Intent.PRIMARY,
  primary: Intent.PRIMARY,
  success: Intent.SUCCESS,
  warning: Intent.WARNING,
  danger: Intent.DANGER,
};

/**
 * @param {object} props
 * @param {number} [props.value]
 * @param {number} [props.max]
 * @param {"default"|"primary"|"success"|"warning"|"danger"|string} [props.variant]
 * @param {string} [props.className]
 * @param {boolean} [props.stripes]
 * @param {boolean} [props.animate]
 * @param {any} [props.label]
 * @param {boolean} [props.showValue]
 */
export function Progress({
  value = 0,
  max = 100,
  label,
  showValue = false,
  variant = "default",
  className = "",
}) {
  const pct = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));
  const intent = intentMap[variant] || Intent.PRIMARY;

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs mb-1.5">
          {label && <span className="bp6-text-muted">{label}</span>}
          {showValue && (
            <span className="font-medium tabular-nums">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <ProgressBar
        value={pct / 100}
        intent={intent}
        stripes={false}
        animate={false}
      />
    </div>
  );
}
