import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";

export function Tooltip({ children, content, side = "top", align = "center", delay = 200 }) {
  if (!content) return children;

  return (
    <BaseTooltip.Provider delay={delay}>
      <BaseTooltip.Root>
        <BaseTooltip.Trigger
          render={(props) => (
            <span className="inline-flex cursor-default" {...props}>
              {children}
            </span>
          )}
        />
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner side={side} align={align} sideOffset={8} className="z-50">
            <BaseTooltip.Popup className="rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-gray-50 shadow-md max-w-xs dark:bg-gray-800 dark:text-gray-50 dark:outline-1 dark:outline-gray-700">
              {content}
              <BaseTooltip.Arrow className="fill-gray-900 dark:fill-gray-800 data-[side=bottom]:top-[-5px] data-[side=top]:bottom-[-5px]" />
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}
