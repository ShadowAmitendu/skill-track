import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
} from "react";
import {
  Alert as BpAlert,
  Button,
  Callout,
  Dialog as BpDialog,
  DialogBody as BpDialogBody,
  DialogFooter as BpDialogFooter,
  H5,
  Intent,
} from "@blueprintjs/core";

/** @type {import("react").Context<{ open: boolean, onOpenChange: (open: boolean) => void }>} */
const AlertDialogContext = createContext({
  open: false,
  onOpenChange: () => {},
});

const variantConfig = {
  warning: { intent: Intent.WARNING, icon: "warning-sign" },
  danger: { intent: Intent.DANGER, icon: "trash" },
  info: { intent: Intent.PRIMARY, icon: "info-sign" },
};

function extractPlainText(node) {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractPlainText).join("").trim();
  if (isValidElement(node) && node.props?.children) {
    return extractPlainText(node.props.children);
  }
  return "";
}

/** @param {{ open?: boolean, onOpenChange?: (open: boolean) => void, children?: any }} props */
export function AlertDialog({ open, onOpenChange, children }) {
  return (
    <AlertDialogContext.Provider value={{ open: Boolean(open), onOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

/**
 * @param {object} props
 * @param {any} [props.children]
 * @param {string} [props.variant]
 * @param {any} [props.icon]
 * @param {string} [props.className]
 */
export function AlertDialogContent({
  children,
  variant = "warning",
  icon,
  className = "",
}) {
  const { open, onOpenChange } = useContext(AlertDialogContext);
  const cfg = variantConfig[variant] || variantConfig.warning;
  const resolvedIcon = icon || cfg.icon;

  let title = null;
  let description = null;
  let footerChildren = [];
  const extraBody = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      if (child !== null && child !== undefined && child !== false) {
        extraBody.push(child);
      }
      return;
    }

    if (child.type === AlertDialogHeader) {
      Children.forEach(child.props.children, (hc) => {
        if (!isValidElement(hc)) return;
        if (hc.type === AlertDialogTitle) {
          title = hc.props.children;
        } else if (hc.type === AlertDialogDescription) {
          description = hc.props.children;
        }
      });
    } else if (child.type === AlertDialogFooter) {
      Children.forEach(child.props.children, (fc) => {
        if (fc !== null && fc !== undefined && fc !== false) {
          footerChildren.push(fc);
        }
      });
    } else {
      extraBody.push(child);
    }
  });

  // If there are no extra form controls in the body, render Blueprint's native Alert!
  if (extraBody.length === 0) {
    const cancelChild = footerChildren.find(
      (c) => isValidElement(c) && c.type === AlertDialogClose
    );
    const confirmChild = footerChildren.find(
      (c) => isValidElement(c) && c.type !== AlertDialogClose
    );

    const cancelText = cancelChild
      ? extractPlainText(cancelChild.props.render || cancelChild.props.children) || "Cancel"
      : "Cancel";
    const confirmText = confirmChild
      ? extractPlainText(confirmChild.props.children) || "Confirm"
      : "Confirm";
    const isConfirmDisabled = Boolean(confirmChild?.props?.disabled && !confirmChild?.props?.loading);
    const isConfirmLoading = Boolean(confirmChild?.props?.loading);

    if (!isConfirmDisabled && confirmText) {
      return (
        <BpAlert
          isOpen={open}
          intent={cfg.intent}
          icon={resolvedIcon}
          confirmButtonText={confirmText}
          cancelButtonText={cancelText}
          loading={isConfirmLoading}
          canOutsideClickCancel={!isConfirmLoading}
          canEscapeKeyCancel={!isConfirmLoading}
          transitionDuration={0}
          className={className}
          onConfirm={() => confirmChild?.props?.onClick?.()}
          onCancel={() => onOpenChange?.(false)}
        >
          {title && <H5 className="!mb-1">{title}</H5>}
          {description && <div className="text-sm">{description}</div>}
        </BpAlert>
      );
    }
  }

  return (
    <BpDialog
      isOpen={open}
      onClose={() => onOpenChange?.(false)}
      title={title}
      icon={resolvedIcon}
      transitionDuration={0}
      canOutsideClickClose
      canEscapeKeyClose
      style={{ width: "100%", maxWidth: "460px" }}
      className={className}
    >
      <BpDialogBody>
        {description && (
          <Callout intent={cfg.intent} className={extraBody.length > 0 ? "mb-4" : ""}>
            {description}
          </Callout>
        )}
        {extraBody}
      </BpDialogBody>
      {footerChildren.length > 0 && <BpDialogFooter actions={footerChildren} />}
    </BpDialog>
  );
}

/** @param {{ children?: any, className?: string }} [_props] */
export function AlertDialogHeader(_props) {
  return null;
}

/** @param {{ children?: any, className?: string }} [_props] */
export function AlertDialogTitle(_props) {
  return null;
}

/** @param {{ children?: any, className?: string }} [_props] */
export function AlertDialogDescription(_props) {
  return null;
}

/** @param {{ children?: any, className?: string }} [_props] */
export function AlertDialogFooter(_props) {
  return null;
}

/**
 * @param {{ render?: any, children?: any, onClick?: (e: any) => void, [key: string]: any }} props
 */
export function AlertDialogClose({ render, children, onClick, ...props }) {
  const { onOpenChange } = useContext(AlertDialogContext);
  const handleClose = (e) => {
    onClick?.(e);
    onOpenChange?.(false);
  };

  if (render && isValidElement(render)) {
    return cloneElement(render, {
      ...props,
      onClick: (e) => {
        render.props.onClick?.(e);
        handleClose(e);
      },
    });
  }

  return (
    <Button variant="outlined" onClick={handleClose} {...props}>
      {children || "Cancel"}
    </Button>
  );
}
