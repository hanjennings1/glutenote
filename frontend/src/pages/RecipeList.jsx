// RecipeList.jsx — The "My Recipes" page (home page).
// Loads one page of saved recipes from GET /recipes, with:
//   - filter chips for each status   (?status=adapted)
//   - a title search box             (?q=bread)
//   - a sort menu                    (?sort=title)
//   - Previous / Next page buttons   (?page=2)
// Everything is kept in the URL, so it survives a page refresh
// and works with the browser's back button.

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "../api";
import { btn, input } from "../ui";
import RecipeCard from "../components/RecipeCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { STATUSES } from "../statuses";

// "All" first, then one chip per status.
const FILTERS = [
  { value: "", label: "All" },
  ...Object.entries(STATUSES).map(([value, { label }]) => ({ value, label })),
];

// Must match SORT_OPTIONS in backend/app.py. "newest" is the default.
const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title (A–Z)" },
];

// 12 fills four rows of three cards on a wide screen.
const PER_PAGE = 12;

export default function RecipeList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "";
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  // "attempt" goes up when the user clicks Try again, which re-runs the request.
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${status}|${q}|${sort}|${page}|${attempt}`;

  // The latest response, tagged with the request it answers.
  // While its key doesn't match the current request, the page is loading.
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const loading = result.key !== requestKey;
  const error = loading ? null : result.error;
  const data = loading ? null : result.data; // { recipes, page, per_page, total, pages }
  const recipes = data?.recipes ?? [];

  // Load recipes whenever the filter, search, sort, or page changes (or on Try again).
  useEffect(() => {
    const params = new URLSearchParams({ sort, page, per_page: PER_PAGE });
    if (status) params.set("status", status);
    if (q) params.set("q", q);

    let ignore = false; // skip a response that arrives after the user changed something again
    apiFetch(`/recipes?${params}`)
      .then((json) => !ignore && setResult({ key: requestKey, data: json, error: null }))
      .catch((err) => !ignore && setResult({ key: requestKey, data: null, error: err.message }));
    return () => {
      ignore = true;
    };
  }, [status, q, sort, page, requestKey]);

  // Change some URL settings and keep the rest. An empty value removes the setting.
  // Changing the filter, search, or sort also goes back to page 1.
  function updateParams(changes) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next);
  }

  function handleSearch(e) {
    e.preventDefault(); // stop the browser from reloading the page
    const term = new FormData(e.target).get("q").trim();
    updateParams({ q: term, page: "" });
  }

  function goToPage(n) {
    updateParams({ page: n > 1 ? n : "" });
    window.scrollTo({ top: 0 }); // start the new page at the top
  }

  const activeLabel = FILTERS.find((f) => f.value === status)?.label;
  const filtering = Boolean(status || q);

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-[1.75rem] font-medium leading-tight">My Recipes</h1>
        {data && (
          <p className="text-sm text-ink-secondary">
            {data.total} {data.total === 1 ? "recipe" : "recipes"}
            {filtering && " found"}
          </p>
        )}
      </div>

      {/* Search and sort */}
      <div className="mb-4 flex flex-wrap gap-2">
        {/* key={q} resets the box when q changes another way, e.g. the Back button */}
        <form key={q} onSubmit={handleSearch} role="search" className="relative min-w-56 flex-1">
          <label htmlFor="recipe-search" className="sr-only">Search my recipes</label>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="recipe-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search by title, then press Enter"
            className={`${input} h-10 pl-9 pr-9`}
          />
          {q && (
            <button
              type="button"
              onClick={() => updateParams({ q: "", page: "" })}
              aria-label="Clear search"
              className={`${btn.icon} absolute right-1 top-1/2 -translate-y-1/2`}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </form>

        {/* Full width on phones, a fixed width next to the search box on larger screens */}
        <div className="w-full sm:w-48">
          <label htmlFor="recipe-sort" className="sr-only">Sort recipes</label>
          <select
            id="recipe-sort"
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value === "newest" ? "" : e.target.value, page: "" })}
            className={`${input} h-10`}
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
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
              onClick={() => updateParams({ status: filter.value, page: "" })}
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

      {/* Empty states: past the last page, nothing matches, or nothing saved yet */}
      {data && recipes.length === 0 && (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          {data.total > 0 ? (
            <>
              <p className="text-ink-secondary">This page is empty.</p>
              <button type="button" onClick={() => goToPage(1)} className={`${btn.secondary} mt-4`}>
                Go to page 1
              </button>
            </>
          ) : filtering ? (
            <>
              <p className="text-ink-secondary">
                No recipes match
                {q && <> “{q}”</>}
                {status && <> in “{activeLabel}”</>}.
              </p>
              <button
                type="button"
                onClick={() => updateParams({ q: "", status: "", page: "" })}
                className={`${btn.secondary} mt-4`}
              >
                Clear search and filters
              </button>
            </>
          ) : (
            <>
              <p className="font-medium">Your recipe box is empty</p>
              <p className="mt-1 text-sm text-ink-secondary">
                Find a recipe to adapt, or add one of your own.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link to="/search" className={btn.primary}>Find recipes</Link>
                <Link to="/recipes/new" className={btn.secondary}>Add a family recipe</Link>
              </div>
            </>
          )}
        </div>
      )}

      {recipes.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <RecipeCard recipe={recipe} />
            </li>
          ))}
        </ul>
      )}

      {/* Page buttons: only when there's more than one page */}
      {data && data.pages > 1 && (
        <nav aria-label="Pages" className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className={btn.secondary}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Previous
          </button>
          <p className="text-sm text-ink-secondary" aria-live="polite">
            Page {page} of {data.pages}
          </p>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= data.pages}
            className={btn.secondary}
          >
            Next
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </nav>
      )}
    </section>
  );
}