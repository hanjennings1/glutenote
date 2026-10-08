// IngredientList.jsx — The Ingredients section of Recipe Detail:
// every ingredient row, the "Add ingredient" form, and the gluten-flag reminder.
// It doesn't store ingredients itself; it reports every change up to the page
// through onChange, so the page (and its "swaps needed" count) stays in sync.

import { Info } from "lucide-react";
import IngredientItem from "./IngredientItem";
import AddIngredientForm from "./AddIngredientForm";

export default function IngredientList({ recipeId, ingredients, onChange }) {
  const flaggedCount = ingredients.filter((i) => i.contains_gluten).length;

  function handleSaved(updated) {
    onChange(ingredients.map((i) => (i.id === updated.id ? updated : i)));
  }

  function handleDeleted(id) {
    onChange(ingredients.filter((i) => i.id !== id));
  }

  function handleAdded(created) {
    onChange([...ingredients, created]);
  }

  return (
    <section aria-labelledby="ingredients-heading">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h2 id="ingredients-heading" className="text-xl font-medium">Ingredients</h2>
        {flaggedCount > 0 && (
          <p className="text-sm text-ink-secondary">
            {flaggedCount} may contain gluten
          </p>
        )}
      </div>

      {ingredients.length === 0 ? (
        <p className="py-3 text-sm text-ink-secondary">No ingredients yet.</p>
      ) : (
        <ul className="divide-y divide-divider">
          {ingredients.map((ingredient) => (
            <IngredientItem
              key={ingredient.id}
              ingredient={ingredient}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
            />
          ))}
        </ul>
      )}

      <AddIngredientForm recipeId={recipeId} onAdded={handleAdded} />

      <p className="mt-5 flex items-start gap-2 text-xs text-ink-secondary">
        <Info size={14} className="mt-px shrink-0" aria-hidden="true" />
        Gluten flags are a guide, not a guarantee. Always check product labels.
      </p>
    </section>
  );
}