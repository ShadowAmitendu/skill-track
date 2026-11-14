import { Tooltip as BpTooltip } from "@blueprintjs/core";

/**
 * @param {object} props
 * @param {any} [props.children]
 * @param {any} [props.content]
 * @param {string} [props.side]
 * @param {string} [props.align]
 * @param {number} [props.delay]
 */
export function Tooltip({ children, content, side = "top", align = "center", delay = 200 }) {
  if (!content) return children;

  const placement = /** @type {import("@blueprintjs/core").Placement} */ (
    align === "center" ? side : `${side}-${align}`
  );

  return (
    <BpTooltip
      content={content}
      placement={placement}
      hoverOpenDelay={delay}
      transitionDuration={0}
    >
      <span className="inline-flex cursor-default">{children}</span>
    </BpTooltip>
  );
}
