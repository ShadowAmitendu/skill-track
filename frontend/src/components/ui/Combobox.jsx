import { useMemo } from "react";
import { Button, MenuItem } from "@blueprintjs/core";
import { Suggest } from "@blueprintjs/select";

/**
 * @param {object} props
 * @param {any} [props.value]
 * @param {(val: any) => void} [props.onValueChange]
 * @param {(val: any) => void} [props.onChange]
 * @param {Array<any>} [props.options]
 * @param {Array<any>} [props.items]
 * @param {string} [props.placeholder]
 * @param {string} [props.emptyMessage]
 * @param {string} [props.className]
 * @param {boolean} [props.disabled]
 */
export function Combobox({
  value,
  onValueChange,
  onChange,
  options,
  items = [],
  placeholder = "Search or select...",
  emptyMessage = "No matching items.",
  className = "",
  disabled = false,
}) {
  const handleSelect = onValueChange || onChange;

  const normalizedOptions = useMemo(() => {
    const sourceOptions = options || items || [];
    return sourceOptions.map((opt) => (typeof opt === "string" ? { value: opt, label: opt } : opt));
  }, [options, items]);

  const selectedItem =
    normalizedOptions.find((opt) => String(opt.value) === String(value)) || null;

  const renderItem = (item, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) return null;
    const isSelected = selectedItem?.value === item.value;
    return (
      <MenuItem
        key={String(item.value)}
        text={item.label}
        active={modifiers.active}
        selected={isSelected}
        icon={isSelected ? "tick" : "blank"}
        onClick={handleClick}
        shouldDismissPopover
      />
    );
  };

  return (
    <Suggest
      items={normalizedOptions}
      itemPredicate={(query, item) =>
        item.label.toLowerCase().includes(query.trim().toLowerCase())
      }
      itemRenderer={renderItem}
      inputValueRenderer={(item) => item?.label || ""}
      selectedItem={selectedItem}
      onItemSelect={(item) => handleSelect?.(item ? item.value : "")}
      noResults={<MenuItem disabled text={emptyMessage} />}
      closeOnSelect
      disabled={disabled}
      resetOnClose
      resetOnSelect
      fill
      className={className}
      popoverProps={{
        matchTargetWidth: true,
        minimal: true,
        transitionDuration: 0,
      }}
      inputProps={{
        placeholder,
        rightElement: value ? (
          <Button
            variant="minimal"
            icon="cross"
            aria-label="Clear selection"
            onClick={(e) => {
              e.stopPropagation();
              handleSelect?.("");
            }}
          />
        ) : undefined,
      }}
    />
  );
}
