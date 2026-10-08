// LoadingSpinner.jsx — Shown while a request is in progress.
// motion-safe: only spins for users who haven't asked their device to reduce motion.

import { LoaderCircle } from "lucide-react";

export default function LoadingSpinner({ label = "Loading…" }) {
  return (
    <div role="status" className="flex items-center gap-2 py-10 text-ink-secondary">
      <LoaderCircle size={20} className="motion-safe:animate-spin" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}