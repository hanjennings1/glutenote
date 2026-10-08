// NotesEditor.jsx — The "Your notes" section of Recipe Detail.
// Shows the recipe's notes in a soft gray box; "Edit notes" turns it into a text box.
// Saves with PATCH /recipes/<id>.

import { useState } from "react";
import { apiFetch } from "../api";
import { btn, input } from "../ui";

export default function NotesEditor({ recipeId, notes, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function startEditing() {
    setDraft(notes || "");
    setError(null);
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await apiFetch(`/recipes/${recipeId}`, {
        method: "PATCH",
        body: JSON.stringify({ notes: draft.trim() || null }),
      });
      onSaved(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="notes-heading">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="notes-heading" className="text-xl font-medium">Your notes</h2>
        {!editing && (
          <button type="button" onClick={startEditing} className={btn.text}>
            {notes ? "Edit notes" : "Add notes"}
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-3">
          <label htmlFor="notes" className="sr-only">Your notes</label>
          <textarea
            id="notes"
            rows={5}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="How did it turn out? What would you change next time?"
            className={input}
            autoFocus
          />
          {error && <p className="text-xs text-error">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className={btn.primary}>
              {saving ? "Saving…" : "Save notes"}
            </button>
            <button type="button" onClick={() => setEditing(false)} disabled={saving} className={btn.secondary}>
              Cancel
            </button>
          </div>
        </form>
      ) : notes ? (
        // whitespace-pre-line keeps the line breaks the user typed
        <p className="whitespace-pre-line rounded-md bg-subtle p-4 text-sm text-ink">{notes}</p>
      ) : (
        <p className="rounded-md bg-subtle p-4 text-sm text-ink-secondary">
          No notes yet. Add how it turned out and what you'd change next time.
        </p>
      )}
    </section>
  );
}