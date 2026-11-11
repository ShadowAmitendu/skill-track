import { Tabs as BaseTabs } from "@base-ui/react/tabs";

export function Tabs({ children, value, onValueChange, defaultValue, className = "", ...props }) {
  return (
    <BaseTabs.Root
      value={value}
      onValueChange={onValueChange}
      defaultValue={defaultValue}
      className={`w-full ${className}`}
      {...props}
    >
      {children}
    </BaseTabs.Root>
  );
}

export function TabsList({ children, className = "", ...props }) {
  return (
    <BaseTabs.List
      className={`relative z-0 inline-flex max-w-full items-center gap-1 px-1 pb-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto ${className}`}
      {...props}
    >
      {children}
      <BaseTabs.Indicator className="absolute top-1/2 left-0 z-[-1] h-7 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] -translate-y-[calc(50%+2px)] rounded-md bg-gray-100 dark:bg-gray-800" />
    </BaseTabs.List>
  );
}

export function TabsTab({ children, value, className = "", ...props }) {
  return (
    <BaseTabs.Tab
      value={value}
      className={`inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap text-gray-600 cursor-pointer select-none outline-none hover:text-gray-900 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-gray-900 data-[active]:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 dark:focus-visible:outline-gray-100 dark:data-[active]:text-gray-50 ${className}`}
      {...props}
    >
      {children}
    </BaseTabs.Tab>
  );
}

export function TabsPanel({ children, value, className = "", ...props }) {
  return (
    <BaseTabs.Panel
      value={value}
      className={`mt-5 outline-none focus-visible:outline-2 focus-visible:outline-gray-900 dark:focus-visible:outline-gray-100 ${className}`}
      {...props}
    >
      {children}
    </BaseTabs.Panel>
  );
}
