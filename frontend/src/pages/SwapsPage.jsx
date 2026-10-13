// SwapsPage.jsx — "My Swaps": every gluten-free swap recorded across your recipes.
// Loads GET /swaps, which groups identical swaps and lists the recipes each was used in,
// most-used first. A quick reference for "what did I use for flour last time?"

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wheat, ArrowRight } from "lucide-react";
import { apiFetch } from "../api";
import { btn } from "../ui";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

export default function SwapsPage() {
  // Same loading pattern as the other pages: the result is tagged with the request it answers.
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, swaps: [], error: null });
  const loading = result.key !== attempt;

  useEffect(() => {
    let ignore = false;
    apiFetch("/swaps")
      .then((data) => !ignore && setResult({ key: attempt, swaps: data, error: null }))
      .catch((err) => !ignore && setResult({ key: attempt, swaps: [], error: err.message }));
    return () => {
      ignore = true;
    };
  }, [attempt]);

  const swaps = loading ? [] : result.swaps;

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[1.75rem] font-medium leading-tight">My Swaps</h1>
          <p className="mt-1 text-ink-secondary">
            Every gluten-free swap you’ve recorded, most used first.
          </p>
        </div>
        {!loading && !result.error && (
          <p className="text-sm text-ink-secondary">
            {swaps.length} {swaps.length === 1 ? "swap" : "swaps"}
          </p>
        )}
      </div>

      {loading && <LoadingSpinner label="Loading your swaps…" />}

      {!loading && result.error && (
        <ErrorMessage message={result.error} onRetry={() => setAttempt((n) => n + 1)} />
      )}

      {!loading && !result.error && swaps.length === 0 && (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="font-medium">No swaps yet</p>
          <p className="mt-1 text-sm text-ink-secondary">
            Open a recipe and click “Add swap” on a flagged ingredient. It will show up here.
          </p>
          <Link to="/" className={`${btn.secondary} mt-5`}>Go to My Recipes</Link>
        </div>
      )}

      {swaps.length > 0 && (
        <ul className="divide-y divide-divider rounded-lg border border-border bg-white">
          {swaps.map((swap) => (
            <li
              key={`${swap.ingredient}|${swap.substitute}`}
              className="grid gap-2 px-4 py-4 sm:grid-cols-[16rem_auto_1fr] sm:items-center sm:gap-4"
            >
              {/* The original ingredient in bordeaux, with a wheat icon to show it contains gluten */}
              <span className="inline-flex items-center gap-1.5 text-sm text-flag">
                <Wheat size={14} className="shrink-0" aria-label="Contains gluten" />
                {swap.ingredient}
              </span>
              <ArrowRight size={16} className="hidden text-gray-400 sm:mr-16 sm:block" aria-hidden="true" />

              <div>
                <p className="text-sm font-medium text-ink">
                  <span className="sr-only">Swapped for </span>
                  {swap.substitute}
                </p>
                <p className="mt-0.5 text-xs text-ink-secondary">
                  Used in{" "}
                  {swap.recipes.map((recipe, index) => (
                    <span key={recipe.id}>
                      {index > 0 && ", "}
                      <Link to={`/recipes/${recipe.id}`} className="text-link hover:underline underline-offset-2">
                        {recipe.title}
                      </Link>
                    </span>
                  ))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}