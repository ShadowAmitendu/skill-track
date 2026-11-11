import { Children, isValidElement, useId } from "react";
import { Tab, Tabs as BpTabs } from "@blueprintjs/core";

/**
 * @param {object} props
 * @param {string} [props.value]
 * @param {(value: string) => void} [props.onValueChange]
 * @param {string} [props.defaultValue]
 * @param {any} [props.children]
 * @param {string} [props.className]
 * @param {string} [props.id]
 * @param {boolean} [props.large]
 * @param {boolean} [props.fill]
 */
export function Tabs({
  value,
  onValueChange,
  defaultValue,
  children,
  className = "",
  id,
  large = false,
  fill = false,
}) {
  const generatedId = useId();
  const tabsId = id || `tabs-${generatedId}`;

  const tabs = [];
  const panels = {};
  let listClassName = "";

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === TabsList) {
      listClassName = child.props.className || "";
      Children.forEach(child.props.children, (tabChild) => {
        if (!isValidElement(tabChild) || tabChild.type !== TabsTab) return;
        tabs.push({
          value: tabChild.props.value,
          title: tabChild.props.children,
          disabled: Boolean(tabChild.props.disabled),
        });
      });
    } else if (child.type === TabsPanel) {
      panels[child.props.value] = {
        children: child.props.children,
        className: child.props.className || "",
      };
    }
  });

  const activeValue = value !== undefined ? value : defaultValue ?? tabs[0]?.value;

  return (
    <BpTabs
      id={tabsId}
      selectedTabId={activeValue}
      onChange={(newTabId) => onValueChange?.(String(newTabId))}
      animate={false}
      renderActiveTabPanelOnly={true}
      large={large}
      fill={fill}
      className={`${listClassName} ${className}`.trim()}
    >
      {tabs.map((tab) => {
        const panelData = panels[tab.value];
        const panelNode = panelData ? (
          <div className={panelData.className}>{panelData.children}</div>
        ) : undefined;

        return (
          <Tab
            key={tab.value}
            id={tab.value}
            title={tab.title}
            disabled={tab.disabled}
            panel={panelNode}
          />
        );
      })}
    </BpTabs>
  );
}

/** @param {{ children?: any, className?: string }} [_props] */
export function TabsList(_props) {
  return null;
}

/** @param {{ value: string, children?: any, disabled?: boolean, className?: string }} [_props] */
export function TabsTab(_props) {
  return null;
}

/** @param {{ value: string, children?: any, className?: string }} [_props] */
export function TabsPanel(_props) {
  return null;
}
