import { Children, isValidElement, useState } from "react";
import { Elevation, Section, SectionCard } from "@blueprintjs/core";

/** @param {{ children?: any, className?: string }} props */
export function Accordion({ children, className = "" }) {
  return <div className={`space-y-2 ${className}`.trim()}>{children}</div>;
}

/** @param {{ children?: any, defaultOpen?: boolean, value?: string, className?: string }} props */
export function AccordionItem({ children, defaultOpen = false, className = "" }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  let triggerContent = null;
  let panelContent = null;
  let panelClassName = "";

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === AccordionHeader) {
      Children.forEach(child.props.children, (inner) => {
        if (isValidElement(inner) && inner.type === AccordionTrigger) {
          triggerContent = inner.props.children;
        }
      });
    } else if (child.type === AccordionTrigger) {
      triggerContent = child.props.children;
    } else if (child.type === AccordionPanel) {
      panelContent = child.props.children;
      panelClassName = child.props.className || "";
    }
  });

  return (
    <Section
      compact
      elevation={Elevation.ZERO}
      collapsible
      collapseProps={{
        isOpen,
        onToggle: () => setIsOpen((prev) => !prev),
      }}
      title={triggerContent}
      className={className}
    >
      <SectionCard
        className={panelClassName}
        data-panel-open={isOpen ? "" : undefined}
      >
        {panelContent}
      </SectionCard>
    </Section>
  );
}

/** @param {{ children?: any, className?: string }} [_props] */
export function AccordionHeader(_props) {
  return null;
}

/** @param {{ children?: any, className?: string }} [_props] */
export function AccordionTrigger(_props) {
  return null;
}

/** @param {{ children?: any, className?: string }} [_props] */
export function AccordionPanel(_props) {
  return null;
}
