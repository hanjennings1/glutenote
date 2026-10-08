// App.jsx — TEMPORARY connection test.
// Loads recipes from the Flask API to prove the frontend and backend can talk.

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
      <h1 className="text-3xl font-medium text-primary">Glutenote</h1>
      <p className="mb-6 text-ink-secondary">Connection test: recipes from the Flask API</p>

      {loading && <p className="text-ink-secondary">Loading recipes…</p>}

      {error && (
        <p className="rounded-md bg-error-bg p-3 text-error">{error}</p>
      )}

      <ul className="space-y-3">
        {recipes.map((recipe) => (
          <li key={recipe.id} className="rounded-lg border border-border bg-white p-4 shadow-card">
            <h2 className="text-lg font-medium">{recipe.title}</h2>
            <p className="text-sm text-ink-secondary">{STATUS_LABELS[recipe.gf_status]}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}