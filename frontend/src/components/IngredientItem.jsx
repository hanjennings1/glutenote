// IngredientItem.jsx — One ingredient row on the Recipe Detail page.
//
// Three looks (from the style guide):
//   - Normal:            amount + name
//   - Flagged, no swap:  name in bordeaux with a wheat-off icon, plus "+ Add swap"
//   - Flagged, swapped:  name crossed out in bordeaux, with the gluten-free swap below it
//
// Clicking "+ Add swap" or the pencil opens an inline editor for this row,
// which saves with PATCH /ingredients/<id> and deletes with DELETE /ingredients/<id>.

import { useState } from "react";
import { WheatOff, Pencil, Plus, CornerDownRight } from "lucide-react";
import { apiFetch } from "../api";
import { btn, inputOnSubtle, label } from "../ui";

export default function IngredientItem({ ingredient, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [focusSwap, setFocusSwap] = useState(false); // open the editor straight on the swap field
  const flagged = ingredient.contains_gluten;
  const swap = ingredient.gf_substitute;

  function openEditor(toSwap = false) {
    setFocusSwap(toSwap);
    setEditing(true);
  }

  if (editing) {
    return (
      <li className="py-3">
        <IngredientEditor
          ingredient={ingredient}
          focusSwap={focusSwap}
          onCancel={() => setEditing(false)}
          onSaved={(updated) => {
            setEditing(false);
            onSaved(updated);
          }}
          onDeleted={onDeleted}
        />
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 py-3">
      {/* Amount column, like a printed recipe card */}
      <span className="w-20 shrink-0 pt-0.5 text-sm text-ink-secondary sm:w-28">
        {ingredient.amount || "—"}
      </span>

      <div className="min-w-0 flex-1 pt-0.5 text-sm">
        <span
          className={[
            "inline-flex items-center gap-1.5",
            flagged ? "text-flag" : "text-ink",
            flagged && swap ? "line-through decoration-flag/70" : "",
          ].join(" ")}
        >
          {flagged && <WheatOff size={14} className="shrink-0" aria-label="May contain gluten" />}
          {ingredient.name}
        </span>

        {/* The gluten-free swap, written under the crossed-out original */}
        {flagged && swap && (
          <span className="mt-1 flex items-center gap-1.5 font-medium text-ink">
            <CornerDownRight size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
            <span className="sr-only">Swapped for </span>
            {swap}
          </span>
        )}
      </div>

      {flagged && !swap && (
        <button type="button" onClick={() => openEditor(true)} className={`${btn.text} pt-0.5`}>
          <Plus size={14} aria-hidden="true" />
          Add swap
        </button>
      )}

      <button
        type="button"
        onClick={() => openEditor(false)}
        className={btn.icon}
        aria-label={`Edit ${ingredient.name}`}
      >
        <Pencil size={15} aria-hidden="true" />
      </button>
    </li>
  );
}

// The inline editor: name, amount, gluten flag, swap, plus Save / Cancel / Delete.
function IngredientEditor({ ingredient, focusSwap, onCancel, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    name: ingredient.name,
    amount: ingredient.amount || "",
    contains_gluten: ingredient.contains_gluten,
    gf_substitute: ingredient.gf_substitute || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // One change handler for every field; checkboxes use "checked" instead of "value".
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSave(e) {
    e.preventDefault(); // stop the browser from reloading the page on submit
    if (!form.name.trim()) {
      setError("Ingredient name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await apiFetch(`/ingredients/${ingredient.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name.trim(),
          amount: form.amount.trim() || null,
          contains_gluten: form.contains_gluten,
          gf_substitute: form.gf_substitute.trim() || null,
        }),
      });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/ingredients/${ingredient.id}`, { method: "DELETE" });
      onDeleted(ingredient.id);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const fieldId = (name) => `ingredient-${ingredient.id}-${name}`;

  return (
    <form onSubmit={handleSave} className="space-y-3 rounded-md bg-subtle p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
        <div>
          <label htmlFor={fieldId("amount")} className={label}>Amount</label>
          <input
            id={fieldId("amount")}
            name="amount"
            value={form.amount}
            onChange={handleChange}
            className={inputOnSubtle}
          />
        </div>
        <div>
          <label htmlFor={fieldId("name")} className={label}>Ingredient</label>
          <input
            id={fieldId("name")}
            name="name"
            value={form.name}
            onChange={handleChange}
            className={inputOnSubtle}
            required
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

      {form.contains_gluten && (
        <div>
          <label htmlFor={fieldId("swap")} className={label}>Gluten-free swap</label>
          <input
            id={fieldId("swap")}
            name="gf_substitute"
            value={form.gf_substitute}
            onChange={handleChange}
            placeholder="e.g. 1:1 gluten-free flour blend"
            autoFocus={focusSwap}
            className={inputOnSubtle}
          />
        </div>
      )}

      {error && <p className="text-xs text-error">{error}</p>}

      {confirmDelete ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto text-sm text-ink">Delete this ingredient?</p>
          <button type="button" onClick={handleDelete} disabled={saving} className={btn.danger}>
            Delete
          </button>
          <button type="button" onClick={() => setConfirmDelete(false)} disabled={saving} className={btn.secondary}>
            Keep it
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={saving} className={btn.primary}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={onCancel} disabled={saving} className={btn.secondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={saving}
            className={`${btn.textDanger} ml-auto`}
          >
            Delete ingredient
          </button>
        </div>
      )}
    </form>
  );
}