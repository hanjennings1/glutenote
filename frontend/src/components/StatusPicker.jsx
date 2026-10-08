// StatusPicker.jsx — Lets the user choose a recipe's gluten-free status.
// Three pill buttons (one per status); the current one is filled in with its badge colors.

import { STATUSES } from "../statuses";

export default function StatusPicker({ value, onChange, disabled }) {
  return (
    <div role="radiogroup" aria-label="Gluten-free status" className="flex flex-wrap gap-2">
      {Object.entries(STATUSES).map(([key, { label, icon: Icon, className }]) => {
        const selected = key === value;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => !selected && onChange(key)}
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              selected
                ? `border-transparent ${className}`
                : "border-border bg-white text-ink-secondary hover:bg-pine-50",
            ].join(" ")}
          >
            <Icon size={13} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}