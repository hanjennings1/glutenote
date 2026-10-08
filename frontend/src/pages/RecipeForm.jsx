// RecipeForm.jsx — Add a family recipe, or edit a recipe's details.
//
// One page, two modes, chosen by the address:
//   /recipes/new       -> Add:  POST /recipes, then open the new recipe
//   /recipes/3/edit    -> Edit: load recipe 3, then PATCH /recipes/3
//
// The form covers the recipe itself (title, photo, instructions, and status when adding).
// Ingredients, swaps, and notes are added on the Recipe Detail page, which already
// has those tools, so there is one place to manage them.

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { apiFetch } from "../api";
import { btn, input, label } from "../ui";
import StatusPicker from "../components/StatusPicker";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

const EMPTY = { title: "", image_url: "", instructions: "", gf_status: "needs_adapting" };

// The "key" gives each mode (and each recipe) a fresh form, so switching from
// "Edit recipe 3" to "Add recipe" in the NavBar never carries old text over.
export default function RecipeForm() {
  const { id } = useParams();
  return <RecipeFormFields key={id || "new"} id={id} />;
}

function RecipeFormFields({ id }) {
  // id is only present when editing
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  // When editing, load the recipe once and fill the form with it.
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${id}|${attempt}`;
  const [loaded, setLoaded] = useState({ key: null, error: null });
  const loading = isEdit && loaded.key !== requestKey;

  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    let ignore = false;
    apiFetch(`/recipes/${id}`)
      .then((recipe) => {
        if (ignore) return;
        setForm({
          title: recipe.title,
          image_url: recipe.image_url || "",
          instructions: recipe.instructions || "",
          gf_status: recipe.gf_status,
        });
        setLoaded({ key: requestKey, error: null });
      })
      .catch((err) => !ignore && setLoaded({ key: requestKey, error: err.message }));
    return () => {
      ignore = true;
    };
  }, [isEdit, id, requestKey]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Check the form before sending it
    const title = form.title.trim();
    const imageUrl = form.image_url.trim();
    if (!title) {
      setError("Please give the recipe a title.");
      return;
    }
    if (imageUrl && !/^https?:\/\//.test(imageUrl)) {
      setError("The photo link should start with http:// or https://");
      return;
    }

    setSaving(true);
    setError(null);
    const body = {
      title,
      image_url: imageUrl || null,
      instructions: form.instructions.trim() || null,
    };

    try {
      const recipe = isEdit
        ? await apiFetch(`/recipes/${id}`, { method: "PATCH", body: JSON.stringify(body) })
        : await apiFetch("/recipes", {
            method: "POST",
            body: JSON.stringify({ ...body, source: "custom", gf_status: form.gf_status }),
          });
      navigate(`/recipes/${recipe.id}`); // show the saved recipe
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const backTo = isEdit ? `/recipes/${id}` : "/";

  if (loading) return <LoadingSpinner label="Loading recipe…" />;
  if (loaded.error) {
    return <ErrorMessage message={loaded.error} onRetry={() => setAttempt((n) => n + 1)} />;
  }

  return (
    <section className="max-w-2xl">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-link hover:underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ChevronLeft size={16} aria-hidden="true" />
        {isEdit ? "Back to recipe" : "My Recipes"}
      </Link>

      <h1 className="mt-6 text-[1.75rem] font-medium leading-tight">
        {isEdit ? "Edit recipe details" : "Add a family recipe"}
      </h1>
      {!isEdit && (
        <p className="mt-1 text-ink-secondary">
          Start with the basics. You'll add ingredients and swaps on the next page.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
        <div>
          <label htmlFor="title" className={label}>Recipe title</label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Grandma's apple crumble"
            className={`${input} h-10`}
            required
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="image_url" className={label}>Photo link (optional)</label>
          <input
            id="image_url"
            name="image_url"
            type="url"
            value={form.image_url}
            onChange={handleChange}
            placeholder="https://…"
            className={`${input} h-10`}
          />
        </div>

        <div>
          <label htmlFor="instructions" className={label}>Instructions (optional)</label>
          <textarea
            id="instructions"
            name="instructions"
            rows={8}
            value={form.instructions}
            onChange={handleChange}
            placeholder="Write each step on its own line."
            className={input}
          />
        </div>

        {/* Status is chosen here only for new recipes; existing ones change it on their page */}
        {!isEdit && (
          <div>
            <p className={label}>Gluten-free status</p>
            <StatusPicker
              value={form.gf_status}
              onChange={(gf_status) => setForm((f) => ({ ...f, gf_status }))}
            />
          </div>
        )}

        {error && <ErrorMessage message={error} />}

        <div className="flex flex-wrap gap-2 border-t border-divider pt-6">
          <button type="submit" disabled={saving} className={btn.primary}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add recipe"}
          </button>
          <Link to={backTo} className={btn.secondary}>Cancel</Link>
        </div>
      </form>
    </section>
  );
}