import { forwardRef } from "react";
import { Button as BpButton, Intent } from "@blueprintjs/core";

const variantConfig = {
  primary: { variant: "solid", intent: Intent.PRIMARY },
  secondary: { variant: "solid", intent: Intent.NONE },
  outline: { variant: "outlined", intent: Intent.NONE },
  outlined: { variant: "outlined", intent: Intent.NONE },
  danger: { variant: "solid", intent: Intent.DANGER },
  ghost: { variant: "minimal", intent: Intent.NONE },
  minimal: { variant: "minimal", intent: Intent.NONE },
  solid: { variant: "solid", intent: Intent.NONE },
  success: { variant: "solid", intent: Intent.SUCCESS },
};

const sizeMap = {
  sm: "small",
  md: "medium",
  lg: "large",
  icon: "medium",
};

/**
 * @typedef {object} ButtonProps
 * @property {any} [children]
 * @property {"primary"|"secondary"|"outlined"|"outline"|"minimal"|"ghost"|"danger"|"success"} [variant]
 * @property {any} [intent]
 * @property {"sm"|"md"|"lg"|"xs"} [size]
 * @property {string} [className]
 * @property {boolean} [disabled]
 * @property {boolean} [loading]
 * @property {"button"|"submit"|"reset"} [type]
 * @property {any} [icon]
 * @property {any} [endIcon]
 * @property {boolean} [active]
 * @property {boolean} [fill]
 * @property {"start"|"center"|"end"} [alignText]
 * @property {(e: any) => void} [onClick]
 * @property {string} [title]
 */

/** @type {import("react").ForwardRefExoticComponent<ButtonProps & Record<string, any> & import("react").RefAttributes<any>>} */
export const Button = forwardRef(
  /**
   * @param {ButtonProps & Record<string, any>} props
   * @param {import("react").Ref<any>} ref
   */
  function Button(
    {
      children,
      variant = "primary",
      intent,
      size = "md",
      className = "",
      disabled = false,
      loading = false,
      type = "button",
      ...props
    },
    ref
  ) {
  const mappedVariant = variantConfig[variant] || variantConfig.primary;
  const mappedSize = sizeMap[size] || "medium";
  return (
    <BpButton
      ref={ref}
      type={type}
      variant={/** @type {any} */ (mappedVariant.variant)}
      intent={intent ?? mappedVariant.intent}
      size={mappedSize}
      disabled={disabled || loading}
      loading={loading}
      className={className}
      {...props}
    >
      {children}
    </BpButton>
  );
  }
);
