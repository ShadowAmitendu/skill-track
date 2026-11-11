import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Search, ChevronDown, Check, X } from "lucide-react";

export function Combobox({
  items = [],
  value,
  onChange,
  placeholder = "Search and select...",
  emptyMessage = "No items found.",
  className = "",
  clearable = true,
}) {
  const normalizedItems = items.map((item) =>
    typeof item === "string" ? { value: item, label: item } : item
  );

  const selectedItem =
    normalizedItems.find((item) => item.value === (value ?? "")) ?? null;

  return (
    <div className={`w-full ${className}`}>
      <BaseCombobox.Root
        items={normalizedItems}
        value={selectedItem}
        onValueChange={(nextItem) => {
          onChange?.(nextItem ? nextItem.value : "");
        }}
        itemToStringLabel={(item) => (item ? item.label : "")}
        itemToStringValue={(item) => (item ? item.value : "")}
        isItemEqualToValue={(a, b) => a?.value === b?.value}
      >
        <div className="relative flex items-center w-full">
          <Search
            size={15}
            className="absolute left-3 text-gray-400 dark:text-gray-500 pointer-events-none shrink-0"
          />
          <BaseCombobox.InputGroup className="w-full">
            <BaseCombobox.Input
              placeholder={placeholder}
              className="h-9 w-full pl-9 pr-14 rounded-md border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none hover:border-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50 dark:placeholder:text-gray-500 dark:hover:border-gray-700 dark:focus-visible:outline-gray-100"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              {clearable && value && (
                <BaseCombobox.Clear
                  className="inline-flex h-6 w-6 items-center justify-center rounded-sm text-gray-400 hover:bg-gray-100 hover:text-gray-900 cursor-pointer dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                  aria-label="Clear selection"
                >
                  <X size={14} />
                </BaseCombobox.Clear>
              )}
              <BaseCombobox.Trigger
                className="inline-flex h-6 w-6 items-center justify-center rounded-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 cursor-pointer dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                aria-label="Toggle options"
              >
                <ChevronDown size={15} />
              </BaseCombobox.Trigger>
            </div>
          </BaseCombobox.InputGroup>
        </div>

        <BaseCombobox.Portal>
          <BaseCombobox.Positioner side="bottom" align="start" sideOffset={6} className="z-50 outline-none select-none">
            <BaseCombobox.Popup className="w-[var(--anchor-width)] max-h-60 overflow-y-auto rounded-md bg-white p-1 text-gray-900 shadow-lg shadow-gray-200/70 outline-1 outline-gray-200 dark:bg-gray-900 dark:text-gray-50 dark:shadow-black/50 dark:outline-gray-800">
              <BaseCombobox.Empty className="py-5 px-3 text-center text-xs text-gray-500 dark:text-gray-400 empty:m-0 empty:p-0">
                {emptyMessage}
              </BaseCombobox.Empty>
              <BaseCombobox.List>
                {(item) => (
                  <BaseCombobox.Item
                    key={item.value}
                    value={item}
                    className="grid grid-cols-[1rem_1fr] items-center gap-2 rounded-sm py-1.5 pr-3 pl-2 text-sm text-gray-900 outline-none select-none cursor-default data-[highlighted]:bg-gray-100 data-[selected]:font-medium dark:text-gray-100 dark:data-[highlighted]:bg-gray-800"
                  >
                    <BaseCombobox.ItemIndicator className="col-start-1 flex items-center justify-center">
                      <Check size={14} className="text-gray-900 dark:text-gray-100" />
                    </BaseCombobox.ItemIndicator>
                    <span className="col-start-2 truncate">{item.label}</span>
                  </BaseCombobox.Item>
                )}
              </BaseCombobox.List>
            </BaseCombobox.Popup>
          </BaseCombobox.Positioner>
        </BaseCombobox.Portal>
      </BaseCombobox.Root>
    </div>
  );
}
