import { Children, cloneElement, isValidElement } from "react";
import {
  Menu as BpMenu,
  MenuDivider as BpMenuDivider,
  MenuItem as BpMenuItem,
  PopoverNext,
} from "@blueprintjs/core";

const placementMap = {
  start: "bottom-start",
  center: "bottom",
  end: "bottom-end",
};

/** @param {{ children?: any }} props */
export function Menu({ children }) {
  let trigger = /** @type {any} */ (null);
  let content = /** @type {any} */ (null);

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === MenuTrigger) trigger = child;
    if (child.type === MenuContent) content = child;
  });

  const placement = content?.props?.align
    ? placementMap[content.props.align] || "bottom-end"
    : "bottom-end";

  const popoverMenu = content ? (
    <BpMenu className={content.props.className}>{content.props.children}</BpMenu>
  ) : undefined;

  return (
    <PopoverNext
      content={popoverMenu}
      placement={placement}
      arrow={false}
      middleware={{ offset: { mainAxis: 4 } }}
      animation="minimal"
      transitionDuration={0}
      shouldReturnFocusOnClose={false}
      popupKind={/** @type {any} */ ("menu")}
      renderTarget={({ isOpen: _isOpen, className: targetClassName, ref, ...targetProps }) => {
        if (!trigger) return null;
        const rendered =
          typeof trigger.props.render === "function"
            ? trigger.props.render({ ...targetProps, ref })
            : isValidElement(trigger.props.render)
              ? cloneElement(trigger.props.render, {
                  ...targetProps,
                  ref,
                  children: trigger.props.children ?? trigger.props.render.props?.children,
                })
              : (
                <button
                  type="button"
                  ref={ref}
                  {...targetProps}
                  className={trigger.props.className}
                >
                  {trigger.props.children}
                </button>
              );

        if (!isValidElement(rendered)) return rendered;
        const mergedClassName = [targetClassName, rendered.props?.className]
          .filter(Boolean)
          .join(" ");
        return cloneElement(rendered, { className: mergedClassName });
      }}
    />
  );
}

/** @param {{ render?: any, children?: any }} [_props] */
export function MenuTrigger(_props) {
  return null;
}

/** @param {{ children?: any, align?: string, side?: string, className?: string }} [_props] */
export function MenuContent(_props) {
  return null;
}

/** @param {{ children?: any, icon?: any, active?: boolean, disabled?: boolean, intent?: any, onClick?: (e: any) => void, className?: string, [key: string]: any }} props */
export function MenuItem({
  children,
  onClick,
  className = "",
  disabled = false,
  intent,
  icon,
  labelElement,
  active = false,
  ...props
}) {
  return (
    <BpMenuItem
      text={children}
      icon={icon}
      labelElement={labelElement}
      active={active}
      disabled={disabled}
      intent={intent}
      onClick={onClick}
      className={className}
      {...props}
    />
  );
}

/** @param {{ title?: string, className?: string }} props */
export function MenuSeparator({ title, className = "" }) {
  return <BpMenuDivider title={title} className={className} />;
}
