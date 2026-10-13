// SwapSuggestions.jsx — "Used before" chips under the swap field in the ingredient editor.
//
// Asks GET /swaps?ingredient=<name> for swaps saved for similar ingredients
// (same name, or a shared gluten keyword like "flour"), and shows each
// substitute as a chip. Clicking a chip fills in the swap field.
//
// Suggestions are a bonus, so while they load, or if the request fails,
// nothing is shown and the editor works as usual.

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { apiFetch } from "../api";

export default function SwapSuggestions({ ingredientName, currentSwap, onPick }) {
  const [swaps, setSwaps] = useState([]);

  useEffect(() => {
    let ignore = false;
    apiFetch(`/swaps?ingredient=${encodeURIComponent(ingredientName)}`)
      .then((data) => !ignore && setSwaps(data))
      .catch(() => {}); // no suggestions is fine
    return () => {
      ignore = true;
    };
  }, [ingredientName]);

  // One chip per substitute (several ingredients can share the same swap),
  // skipping whatever is already typed in the field.
  const current = currentSwap.trim().toLowerCase();
  const seen = new Set();
  const chips = [];
  for (const swap of swaps) {
    const key = swap.substitute.trim().toLowerCase();
    if (key === current || seen.has(key)) continue;
    seen.add(key);
    chips.push(swap);
  }

  if (chips.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1 text-xs text-ink-secondary">
        <History size={13} aria-hidden="true" />
        Used before:
      </span>
      {chips.map((swap) => (
        <button
          key={swap.substitute}
          type="button"
          onClick={() => onPick(swap.substitute)}
          title={`Used for ${swap.ingredient} in ${swap.recipes.map((r) => r.title).join(", ")}`}
          className="rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-pine-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {swap.substitute}
          {swap.times_used > 1 && (
            <span className="ml-1 font-normal text-ink-secondary">· {swap.times_used} recipes</span>
          )}
        </button>
      ))}
    </div>
  );
}