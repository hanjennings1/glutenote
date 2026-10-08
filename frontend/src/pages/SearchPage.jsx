// SearchPage.jsx — Search TheMealDB and save recipes to adapt.
// Uses GET /search?q=, which returns previews with gluten flags (nothing is saved yet).
// The search term is kept in the URL (e.g. /search?q=lasagne), so refreshing
// the page or pressing Back keeps the results.

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { apiFetch } from "../api";
import { btn, input } from "../ui";
import SearchResult from "../components/SearchResult";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

// Starting ideas, shown before the first search
const SUGGESTIONS = ["Lasagne", "Pancakes", "Teriyaki", "Shakshuka", "Pie"];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [draft, setDraft] = useState(query); // what's typed in the box

  // Same loading pattern as My recipes: the result is tagged with the request it answers.
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${query}|${attempt}`;
  const [result, setResult] = useState({ key: null, results: [], error: null });
  const loading = query !== "" && result.key !== requestKey;

  useEffect(() => {
    if (!query) return; // nothing to search yet
    let ignore = false;
    apiFetch(`/search?q=${encodeURIComponent(query)}`)
      .then((data) => !ignore && setResult({ key: requestKey, results: data, error: null }))
      .catch((err) => !ignore && setResult({ key: requestKey, results: [], error: err.message }));
    return () => {
      ignore = true;
    };
  }, [query, requestKey]);

  function runSearch(term) {
    const trimmed = term.trim();
    if (!trimmed) return;
    setDraft(trimmed);
    setSearchParams({ q: trimmed });
  }

  function handleSubmit(e) {
    e.preventDefault();
    runSearch(draft);
  }

  const showResults = query && !loading && !result.error;

  return (
    <section>
      <h1 className="text-[1.75rem] font-medium leading-tight">Find recipes</h1>
      <p className="mt-1 text-ink-secondary">
        Search TheMealDB, then save a recipe to adapt it.
      </p>

      <form onSubmit={handleSubmit} role="search" className="mt-5 flex max-w-xl gap-2">
        <label htmlFor="search" className="sr-only">Dish name</label>
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="search"
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search by dish name, e.g. lasagne"
            className={`${input} h-10 pl-9`}
          />
        </div>
        <button type="submit" className={btn.primary}>Search</button>
      </form>

      {/* Before the first search: a few ideas to try */}
      {!query && (
        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-ink-secondary">
          <span>Try:</span>
          {SUGGESTIONS.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => runSearch(term)}
              className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-ink-secondary hover:bg-pine-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {term}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        {loading && <LoadingSpinner label="Searching TheMealDB…" />}

        {query && !loading && result.error && (
          <ErrorMessage message={result.error} onRetry={() => setAttempt((n) => n + 1)} />
        )}

        {showResults && result.results.length === 0 && (
          <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
            <p className="font-medium">No recipes found for “{query}”</p>
            <p className="mt-1 text-sm text-ink-secondary">
              Try a different dish name, or a single word like “chicken” or “cake.”
            </p>
          </div>
        )}

        {showResults && result.results.length > 0 && (
          <>
            <p className="mb-4 text-sm text-ink-secondary">
              {result.results.length} {result.results.length === 1 ? "recipe" : "recipes"} for “{query}”
            </p>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {result.results.map((r) => (
                <li key={r.mealdb_id}>
                  <SearchResult result={r} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}