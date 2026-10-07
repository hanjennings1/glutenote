// App.jsx — TEMPORARY connection test.
// Loads recipes from the Flask API to prove the frontend and backend can talk.
// This file will be replaced with React Router and the real pages on Thursday.

import { useEffect, useState } from "react";
import { apiFetch } from "./api";

const STATUS_LABELS = {
  naturally_gf: "Naturally gluten-free",
  adapted: "Adapted",
  needs_adapting: "Needs adapting",
};

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Runs once when the page first loads.
  useEffect(() => {
    apiFetch("/recipes")
      .then(setRecipes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-2xl p-6 text-ink">
      <h1 className="text-3xl font-bold text-fern">Glutenote</h1>
      <p className="mb-6 text-ink-muted">Connection test: recipes from the Flask API</p>

      {loading && <p className="text-ink-muted">Loading recipes…</p>}

      {error && (
        <p className="rounded-md bg-burnt-rose-light p-3 text-burnt-rose">{error}</p>
      )}

      <ul className="space-y-3">
        {recipes.map((recipe) => (
          <li key={recipe.id} className="rounded-lg border border-pale-slate bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">{recipe.title}</h2>
            <p className="text-sm text-ink-muted">{STATUS_LABELS[recipe.gf_status]}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}