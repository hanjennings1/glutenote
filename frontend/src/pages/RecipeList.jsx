// RecipeList.jsx — The "My recipes" page (home page).
// Loads saved recipes from GET /recipes, with filter chips for each status.
// The chosen filter is kept in the URL (e.g. /?status=adapted), so it survives
// a page refresh and works with the browser's back button.

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../api";
import RecipeCard from "../components/RecipeCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { STATUSES } from "../statuses";

// "All" first, then one chip per status.
const FILTERS = [
  { value: "", label: "All" },
  ...Object.entries(STATUSES).map(([value, { label }]) => ({ value, label })),
];

export default function RecipeList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "";

  // "attempt" goes up when the user clicks Try again, which re-runs the request.
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${status}|${attempt}`;

  // The latest response, tagged with the request it answers.
  // While its key doesn't match the current request, the page is loading.
  const [result, setResult] = useState({ key: null, recipes: [], error: null });
  const loading = result.key !== requestKey;
  const recipes = loading ? [] : result.recipes;
  const error = loading ? null : result.error;

  // Load recipes whenever the filter changes (or on Try again).
  useEffect(() => {
    let ignore = false; // skip a response that arrives after the filter changed again
    apiFetch(status ? `/recipes?status=${status}` : "/recipes")
      .then((data) => !ignore && setResult({ key: requestKey, recipes: data, error: null }))
      .catch((err) => !ignore && setResult({ key: requestKey, recipes: [], error: err.message }));
    return () => {
      ignore = true;
    };
  }, [status, requestKey]);

  function chooseFilter(value) {
    setSearchParams(value ? { status: value } : {});
  }

  const activeLabel = FILTERS.find((f) => f.value === status)?.label;

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-[1.75rem] font-medium leading-tight">My recipes</h1>
        {!loading && !error && (
          <p className="text-sm text-ink-secondary">
            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
          </p>
        )}
      </div>

      {/* Filter chips: scroll sideways on narrow screens */}
      <div
        role="group"
        aria-label="Filter by gluten-free status"
        className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      >
        {FILTERS.map((filter) => {
          const active = filter.value === status;
          return (
            <button
              key={filter.value || "all"}
              type="button"
              onClick={() => chooseFilter(filter.value)}
              aria-pressed={active}
              className={[
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-ink-secondary hover:bg-pine-50",
              ].join(" ")}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {loading && <LoadingSpinner label="Loading your recipes…" />}

      {error && <ErrorMessage message={error} onRetry={() => setAttempt((n) => n + 1)} />}

      {/* Empty states: nothing saved yet, or nothing matches the filter */}
      {!loading && !error && recipes.length === 0 && (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          {status ? (
            <p className="text-ink-secondary">No recipes are marked “{activeLabel}” yet.</p>
          ) : (
            <>
              <p className="font-medium">Your recipe box is empty</p>
              <p className="mt-1 text-sm text-ink-secondary">
                Find a recipe to adapt, or add one of your own.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  to="/search"
                  className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Search recipes
                </Link>
                <Link
                  to="/recipes/new"
                  className="rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium hover:bg-pine-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Add a family recipe
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {!loading && !error && recipes.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <RecipeCard recipe={recipe} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}