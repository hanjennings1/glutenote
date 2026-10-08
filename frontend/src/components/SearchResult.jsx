// SearchResult.jsx — One TheMealDB recipe on the Search page.
// Shows the photo, title, and a gluten preview (which ingredients would be flagged).
// "Save recipe" imports it with POST /recipes/import, then opens it so the user can adapt it.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WheatOff, Leaf, Plus, Check, CookingPot } from "lucide-react";
import { apiFetch } from "../api";
import { btn } from "../ui";

export default function SearchResult({ result }) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(result.saved); // true if already in My recipes

  const flagged = result.ingredients.filter((i) => i.contains_gluten).map((i) => i.name);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const recipe = await apiFetch("/recipes/import", {
        method: "POST",
        body: JSON.stringify({ mealdb_id: result.mealdb_id }),
      });
      navigate(`/recipes/${recipe.id}`); // straight to Recipe Detail to start adapting
    } catch (err) {
      // 409 means it was saved already (for example, in another tab)
      if (err.message.includes("already in your collection")) {
        setSaved(true);
      } else {
        setError(err.message);
      }
      setSaving(false);
    }
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-white shadow-card">
      <div className="aspect-[4/3] bg-pine-50">
        {result.image_url ? (
          <img src={result.image_url} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-pine-600/50">
            <CookingPot size={40} strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h2 className="font-medium leading-snug">{result.title}</h2>

        {/* Gluten preview: what will be flagged if this recipe is saved */}
        {flagged.length > 0 ? (
          <div className="text-sm">
            <p className="flex items-center gap-1.5 font-medium text-flag">
              <WheatOff size={14} aria-hidden="true" />
              {flagged.length} may contain gluten
            </p>
            <p className="mt-0.5 text-ink-secondary">{flagged.join(", ")}</p>
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-sm font-medium text-pine-800">
            <Leaf size={14} aria-hidden="true" />
            No gluten flags
          </p>
        )}

        {error && <p className="text-xs text-error">{error}</p>}

        <div className="mt-auto pt-1">
          {saved ? (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary">
              <Check size={16} aria-hidden="true" />
              In your recipes
            </p>
          ) : (
            <button type="button" onClick={handleSave} disabled={saving} className={`${btn.secondary} w-full`}>
              <Plus size={16} aria-hidden="true" />
              {saving ? "Saving…" : "Save recipe"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}