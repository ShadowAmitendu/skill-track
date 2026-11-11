import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
} from "react";
import {
  Button,
  Dialog as BpDialog,
  DialogBody as BpDialogBody,
  DialogFooter as BpDialogFooter,
} from "@blueprintjs/core";

/** @type {import("react").Context<{ open: boolean, onOpenChange: (open: boolean) => void }>} */
const DialogContext = createContext({
  open: false,
  onOpenChange: () => {},
});

const maxWidthPxMap = {
  "max-w-sm": "384px",
  "max-w-md": "448px",
  "max-w-lg": "512px",
  "max-w-xl": "576px",
  "max-w-2xl": "672px",
};

function getTextNodesAndParts(children) {
  let title = undefined;
  let description = undefined;
  let footerChildren = null;
  let footerClassName = "";
  let formElement = null;
  const bodyChildren = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      if (child !== null && child !== undefined && child !== false) {
        bodyChildren.push(child);
      }
      return;
    }

    if (child.type === DialogHeader) {
      Children.forEach(child.props.children, (headerChild) => {
        if (!isValidElement(headerChild)) return;
        if (headerChild.type === DialogTitle) {
          title = headerChild.props.children;
        } else if (headerChild.type === DialogDescription) {
          description = headerChild.props.children;
        }
      });
    } else if (child.type === DialogFooter) {
      footerChildren = child.props.children;
      footerClassName = child.props.className || "";
    } else if (child.type === "form") {
      formElement = child;
    } else {
      bodyChildren.push(child);
    }
  });

  return {
    title,
    description,
    footerChildren,
    footerClassName,
    formElement,
    bodyChildren,
  };
}

/** @param {{ open?: boolean, onOpenChange?: (open: boolean) => void, children?: any }} props */
export function Dialog({ open, onOpenChange, children }) {
  return (
    <DialogContext.Provider value={{ open: Boolean(open), onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

/**
 * @param {object} props
 * @param {any} [props.children]
 * @param {string} [props.className]
 * @param {string} [props.maxWidth]
 * @param {any} [props.icon]
 * @param {boolean} [props.canOutsideClickClose]
 * @param {boolean} [props.canEscapeKeyClose]
 * @param {any} [props.style]
 */
export function DialogContent({
  children,
  className = "",
  maxWidth = "max-w-lg",
  icon,
  style,
}) {
  const { open, onOpenChange } = useContext(DialogContext);
  const parts = getTextNodesAndParts(children);

  let renderedContent;

  if (parts.formElement) {
    let formFooter = null;
    let formFooterClass = "";
    const formBody = [];

    Children.forEach(parts.formElement.props.children, (fc) => {
      if (isValidElement(fc) && fc.type === DialogFooter) {
        formFooter = fc.props.children;
        formFooterClass = fc.props.className || "";
      } else {
        formBody.push(fc);
      }
    });

    renderedContent = cloneElement(
      parts.formElement,
      {},
      <>
        <BpDialogBody>
          {parts.description && (
            <p className="bp6-text-muted text-xs mb-4">{parts.description}</p>
          )}
          {formBody}
        </BpDialogBody>
        {formFooter && <BpDialogFooter className={formFooterClass} actions={formFooter} />}
      </>
    );
  } else {
    renderedContent = (
      <>
        <BpDialogBody>
          {parts.description && (
            <p className="bp6-text-muted text-xs mb-4">{parts.description}</p>
          )}
          {parts.bodyChildren}
        </BpDialogBody>
        {parts.footerChildren && (
          <BpDialogFooter className={parts.footerClassName} actions={parts.footerChildren} />
        )}
      </>
    );
  }

  return (
    <BpDialog
      isOpen={open}
      onClose={() => onOpenChange?.(false)}
      title={parts.title}
      icon={icon}
      transitionDuration={0}
      canOutsideClickClose
      canEscapeKeyClose
      style={{
        width: "100%",
        maxWidth: maxWidthPxMap[maxWidth] || "512px",
        ...style,
      }}
      className={className}
    >
      {renderedContent}
    </BpDialog>
  );
}

/** @param {{ children?: any, className?: string }} [_props] */
export function DialogHeader(_props) {
  return null;
}

/** @param {{ children?: any, className?: string }} [_props] */
export function DialogTitle(_props) {
  return null;
}

/** @param {{ children?: any, className?: string }} [_props] */
export function DialogDescription(_props) {
  return null;
}

/** @param {{ children?: any, className?: string }} [_props] */
export function DialogFooter(_props) {
  return null;
}

/**
 * @param {{ render?: any, children?: any, onClick?: (e: any) => void, [key: string]: any }} props
 */
export function DialogClose({ render, children, onClick, ...props }) {
  const { onOpenChange } = useContext(DialogContext);
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

export { BpDialog as BlueprintDialog, BpDialogBody as DialogBody, BpDialogFooter as BlueprintDialogFooter };
