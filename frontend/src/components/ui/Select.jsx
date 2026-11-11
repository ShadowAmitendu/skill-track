import { Button, MenuItem } from "@blueprintjs/core";
import { Select as BpSelect } from "@blueprintjs/select";

/**
 * @param {object} props
 * @param {any} [props.value]
 * @param {(val: any) => void} [props.onValueChange]
 * @param {Array<{ value: any, label: string, disabled?: boolean }>} [props.options]
 * @param {string} [props.placeholder]
 * @param {string} [props.className]
 * @param {boolean} [props.disabled]
 * @param {string} [props.alignText]
 */
export function Select({
  value,
  onValueChange,
  options = [],
  placeholder = "Select...",
  className = "",
  disabled = false,
  alignText = "left",
}) {
  const selected = options.find((opt) => String(opt.value) === String(value)) || null;

  const renderItem = (item, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) return null;
    const isSelected = selected?.value === item.value;
    return (
      <MenuItem
        key={String(item.value)}
        text={item.label}
        active={modifiers.active}
        selected={isSelected}
        icon={isSelected ? "tick" : "blank"}
        disabled={Boolean(item.disabled)}
        onClick={handleClick}
        shouldDismissPopover
      />
    );
  };

  return (
    <BpSelect
      items={options}
      itemRenderer={renderItem}
      filterable={false}
      activeItem={selected}
      onItemSelect={(item) => onValueChange?.(item.value)}
      disabled={disabled}
      popoverProps={{
        matchTargetWidth: true,
        minimal: true,
        transitionDuration: 0,
      }}
      className={className}
    >
      <Button
        variant="outlined"
        fill
        alignText={/** @type {any} */ (alignText)}
        disabled={disabled}
        endIcon="double-caret-vertical"
        text={selected ? selected.label : placeholder}
      />
    </BpSelect>
  );
}
