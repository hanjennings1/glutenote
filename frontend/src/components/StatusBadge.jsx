// StatusBadge.jsx — The pill showing a recipe's gluten-free status.
// Each status has its own color AND icon, so it isn't shown by color alone.

import { STATUSES } from "../statuses";

// swapsNeeded: how many flagged ingredients still need a swap (from the API).
export default function StatusBadge({ status, swapsNeeded = 0 }) {
  const config = STATUSES[status];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.75 text-xs font-medium ${config.className}`}
    >
      <Icon size={13} aria-hidden="true" />
      {config.label}
      {status === "needs_adapting" && swapsNeeded > 0 && (
        <span aria-label={`${swapsNeeded} swaps needed`}> · {swapsNeeded}</span>
      )}
    </span>
  );
}