// AddIngredientForm.jsx — "Add ingredient" button that opens a small form.
// Saves with POST /ingredients, then hands the new ingredient back to the page.

import { useState } from "react";
import { Plus } from "lucide-react";
import { apiFetch } from "../api";
import { btn, input, label } from "../ui";

const EMPTY = { name: "", amount: "", contains_gluten: false };

export default function AddIngredientForm({ recipeId, onAdded }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  function close() {
    setOpen(false);
    setForm(EMPTY);
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Ingredient name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await apiFetch("/ingredients", {
        method: "POST",
        body: JSON.stringify({
          recipe_id: recipeId,
          name: form.name.trim(),
          amount: form.amount.trim() || null,
          contains_gluten: form.contains_gluten,
        }),
      });
      onAdded(created);
      setForm(EMPTY); // keep the form open, ready for the next ingredient
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${btn.text} mt-3`}>
        <Plus size={14} aria-hidden="true" />
        Add ingredient
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 border-t border-divider pt-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
        <div>
          <label htmlFor="new-amount" className={label}>Amount</label>
          <input
            id="new-amount"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="e.g. 2 tbsp"
            className={input}
          />
        </div>
        <div>
          <label htmlFor="new-name" className={label}>Ingredient</label>
          <input
            id="new-name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. soy sauce"
            className={input}
            autoFocus
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="contains_gluten"
          checked={form.contains_gluten}
          onChange={handleChange}
          className="size-4 accent-primary"
        />
        May contain gluten
      </label>

      {error && <p className="text-xs text-error">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={btn.primary}>
          {saving ? "Adding…" : "Add"}
        </button>
        <button type="button" onClick={close} disabled={saving} className={btn.secondary}>
          Done
        </button>
      </div>
    </form>
  );
}