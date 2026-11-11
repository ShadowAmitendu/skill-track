import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";

export function Accordion({ children, value, onValueChange, defaultValue, className = "", ...props }) {
  return (
    <BaseAccordion.Root
      value={value}
      onValueChange={onValueChange}
      defaultValue={defaultValue}
      className={`w-full divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white overflow-hidden dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900 ${className}`}
      {...props}
    >
      {children}
    </BaseAccordion.Root>
  );
}

export function AccordionItem({ children, value, className = "", ...props }) {
  return (
    <BaseAccordion.Item value={value} className={`outline-none ${className}`} {...props}>
      {children}
    </BaseAccordion.Item>
  );
}

export function AccordionHeader({ children, className = "", ...props }) {
  return (
    <BaseAccordion.Header className={`m-0 ${className}`} {...props}>
      {children}
    </BaseAccordion.Header>
  );
}

export function AccordionTrigger({ children, className = "", ...props }) {
  return (
    <BaseAccordion.Trigger
      className={`group flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gray-900 cursor-pointer select-none dark:text-gray-100 dark:hover:bg-gray-800 dark:focus-visible:outline-gray-100 ${className}`}
      {...props}
    >
      {children}
      <ChevronDown
        size={16}
        className="text-gray-500 dark:text-gray-400 group-data-[panel-open]:rotate-180 shrink-0"
      />
    </BaseAccordion.Trigger>
  );
}

export function AccordionPanel({ children, className = "", ...props }) {
  return (
    <BaseAccordion.Panel
      className={`overflow-hidden text-sm text-gray-600 dark:text-gray-300 ${className}`}
      {...props}
    >
      <div className="px-4 pb-3.5 pt-2 border-t border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/60 leading-relaxed">
        {children}
      </div>
    </BaseAccordion.Panel>
  );
}
