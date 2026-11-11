import { FormGroup, InputGroup, Intent, TextArea as BpTextArea } from "@blueprintjs/core";

/**
 * @param {object} props
 * @param {any} [props.label]
 * @param {boolean} [props.required]
 * @param {any} [props.description]
 * @param {any} [props.error]
 * @param {any} [props.children]
 * @param {string} [props.id]
 * @param {boolean} [props.inline]
 * @param {string} [props.className]
 */
export function Field({
  label,
  required,
  description,
  error,
  children,
  id,
  inline = false,
  className = "",
}) {
  return (
    <FormGroup
      label={label}
      labelFor={id}
      labelInfo={required ? <span className="bp6-text-muted">(required)</span> : undefined}
      helperText={error || description}
      intent={error ? Intent.DANGER : Intent.NONE}
      inline={inline}
      className={className}
    >
      {children}
    </FormGroup>
  );
}

/** @param {Record<string, any>} props */
export function Input({
  className = "",
  error,
  hasError,
  intent,
  fill = true,
  ref,
  ...props
}) {
  return (
    <InputGroup
      inputRef={ref}
      fill={fill}
      intent={intent || (error || hasError ? Intent.DANGER : Intent.NONE)}
      className={className}
      {...props}
    />
  );
}

/**
 * @param {object} props
 * @param {string} [props.className]
 * @param {any} [props.error]
 * @param {boolean} [props.hasError]
 * @param {any} [props.intent]
 * @param {boolean} [props.fill]
 * @param {number} [props.rows]
 * @param {any} [props.ref]
 * @param {string} [props.placeholder]
 * @param {string} [props.id]
 * @param {string} [props.value]
 * @param {(e: any) => void} [props.onChange]
 * @param {boolean} [props.disabled]
 */
export function Textarea({
  className = "",
  error,
  hasError,
  intent,
  fill = true,
  rows = 3,
  ref,
  ...props
}) {
  return (
    <BpTextArea
      inputRef={ref}
      fill={fill}
      rows={rows}
      intent={intent || (error || hasError ? Intent.DANGER : Intent.NONE)}
      className={className}
      {...props}
    />
  );
}
