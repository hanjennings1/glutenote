// ErrorMessage.jsx — Shown when a request fails.
// Uses the app's error red, never bordeaux (bordeaux only ever means gluten).
// onRetry is optional: when given, a "Try again" button appears.

import { CircleAlert } from "lucide-react";

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-start gap-3 rounded-md border border-error/20 bg-error-bg p-4 text-error"
    >
      <CircleAlert size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-sm text-sm font-medium underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-error"
        >
          Try again
        </button>
      )}
    </div>
  );
}