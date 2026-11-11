import { Button, Icon, Intent, NonIdealState, Spinner } from "@blueprintjs/core";
import { Card } from "./Card";

/**
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.message]
 * @param {number} [props.rows]
 * @param {string} [props.className]
 */
export function LoadingState({
  label,
  message = "Loading data...",
  rows = 4,
  className = "",
}) {
  return (
    <Card className={className}>
      <NonIdealState
        icon={<Spinner size={36} intent={Intent.PRIMARY} />}
        title={label || message}
        description={`Fetching latest records (${rows} sections)...`}
      />
    </Card>
  );
}

/**
 * @param {object} props
 * @param {string} [props.title]
 * @param {string} [props.message]
 * @param {any} [props.error]
 * @param {() => void} [props.onRetry]
 * @param {string} [props.className]
 */
export function ErrorState({
  title = "Unable to load data",
  error,
  message,
  onRetry,
  className = "",
}) {
  const detail =
    message || error?.message || "An unexpected error occurred while fetching data.";

  return (
    <Card className={className}>
      <NonIdealState
        icon={<Icon icon="error" size={36} intent={Intent.DANGER} />}
        iconMuted={false}
        title={title}
        description={detail}
        action={
          onRetry ? (
            <Button variant="outlined" intent={Intent.PRIMARY} icon="refresh" onClick={onRetry}>
              Retry
            </Button>
          ) : undefined
        }
      />
    </Card>
  );
}

/**
 * @param {object} props
 * @param {any} [props.icon]
 * @param {string} [props.title]
 * @param {any} [props.description]
 * @param {any} [props.action]
 * @param {string} [props.className]
 */
export function EmptyState({
  icon = "inbox",
  title = "No records found",
  description = "No items match your current criteria.",
  action,
  className = "",
}) {
  return (
    <Card className={className}>
      <NonIdealState
        icon={/** @type {any} */ (icon)}
        title={title}
        description={description}
        action={action}
      />
    </Card>
  );
}
