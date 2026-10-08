// ui.js — Shared Tailwind class strings for buttons and form fields,
// so every page uses the exact same styles from the style guide.
// Use like: <button className={btn.primary}>Save</button>

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export const btn = {
  // Main action (only one per screen): solid pine
  primary: `inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover active:bg-primary-pressed disabled:opacity-50 ${focusRing}`,
  // Everything else: white with a gray outline
  secondary: `inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-pine-50 disabled:opacity-50 ${focusRing}`,
  // Destructive actions (delete): app-error red, never bordeaux
  danger: `inline-flex items-center justify-center gap-1.5 rounded-md border border-error/30 bg-white px-4 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error-bg disabled:opacity-50 ${focusRing}`,
  // Small text-style action, e.g. "+ Add swap"
  text: `inline-flex items-center gap-1 rounded-sm text-sm font-medium text-primary hover:underline underline-offset-2 ${focusRing}`,
  // Small text-style destructive action, e.g. "Delete ingredient"
  textDanger: `inline-flex items-center gap-1 rounded-sm text-sm font-medium text-error hover:underline underline-offset-2 ${focusRing}`,
  // Square icon-only button, e.g. the edit pencil
  icon: `inline-flex size-8 items-center justify-center rounded-sm text-gray-400 transition-colors hover:bg-pine-50 hover:text-primary ${focusRing}`,
};

// Text inputs and textareas: pine border + glow on focus
const inputBase =
  "w-full rounded-sm border border-border px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/25";

// On a white page: subtle gray fill (style guide default)
export const input = `${inputBase} bg-subtle`;
// Inside a gray box (e.g. the ingredient editor): white fill so it stands out
export const inputOnSubtle = `${inputBase} bg-white`;

export const label = "mb-1 block text-xs font-medium text-ink-secondary";