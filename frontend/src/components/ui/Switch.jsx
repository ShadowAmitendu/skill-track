import { Alignment, Switch as BpSwitch } from "@blueprintjs/core";

/**
 * @param {object} props
 * @param {string} [props.id]
 * @param {boolean} [props.checked]
 * @param {(checked: boolean) => void} [props.onCheckedChange]
 * @param {(e: any) => void} [props.onChange]
 * @param {string} [props.label]
 * @param {string} [props.description]
 * @param {boolean} [props.disabled]
 * @param {string} [props.className]
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  label,
  description,
  className = "",
  id,
  ...props
}) {
  const switchEl = (
    <BpSwitch
      id={id}
      checked={Boolean(checked)}
      disabled={disabled}
      alignIndicator={label ? Alignment.END : Alignment.START}
      onChange={(e) => onCheckedChange?.(e.currentTarget.checked)}
      className={!description ? className : "!mb-0"}
      labelElement={
        label ? (
          <span>
            <span className="font-medium">{label}</span>
            {description && (
              <span className="block bp6-text-muted text-xs mt-0.5">{description}</span>
            )}
          </span>
        ) : undefined
      }
      {...props}
    />
  );

  if (!label && !description) {
    return switchEl;
  }

  return <div className={className}>{switchEl}</div>;
}
