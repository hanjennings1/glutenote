// RecipeDetail.jsx — One recipe: photo, status, ingredients with gluten swaps,
// notes, and instructions. This is the heart of Glutenote: where recipes get adapted.
//
// Loads the recipe from GET /recipes/<id> (which includes its ingredients).
// The ingredient and notes sections save their own changes and report back,
// so this page always holds the latest version of the recipe.

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, CookingPot, CircleCheck } from "lucide-react";
import { apiFetch } from "../api";
import { btn } from "../ui";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import StatusPicker from "../components/StatusPicker";
import IngredientList from "../components/IngredientList";
import NotesEditor from "../components/NotesEditor";

export default function RecipeDetail() {
  const { id } = useParams(); // the :id from the address, e.g. /recipes/3
  const navigate = useNavigate();

  // Loading works like My recipes: the result is tagged with the request it answers.
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${id}|${attempt}`;
  const [result, setResult] = useState({ key: null, recipe: null, error: null });
  const loading = result.key !== requestKey;

  useEffect(() => {
    let ignore = false;
    apiFetch(`/recipes/${id}`)
      .then((data) => !ignore && setResult({ key: requestKey, recipe: data, error: null }))
      .catch((err) => !ignore && setResult({ key: requestKey, recipe: null, error: err.message }));
    return () => {
      ignore = true;
    };
  }, [id, requestKey]);

  // Status changes and recipe deletion
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (loading) return <LoadingSpinner label="Loading recipe…" />;
  if (result.error) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorMessage message={result.error} onRetry={() => setAttempt((n) => n + 1)} />
      </div>
    );
  }

  const recipe = result.recipe;

  // Replace the stored recipe with a newer version (from a save).
  function updateRecipe(changes) {
    setResult((r) => ({ ...r, recipe: { ...r.recipe, ...changes } }));
  }

  async function changeStatus(gf_status) {
    setBusy(true);
    setActionError(null);
    try {
      const updated = await apiFetch(`/recipes/${recipe.id}`, {
        method: "PATCH",
        body: JSON.stringify({ gf_status }),
      });
      updateRecipe({ gf_status: updated.gf_status });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteRecipe() {
    setBusy(true);
    setActionError(null);
    try {
      await apiFetch(`/recipes/${recipe.id}`, { method: "DELETE" });
      navigate("/"); // back to My recipes
    } catch (err) {
      setActionError(err.message);
      setBusy(false);
    }
  }

  // Counted from the ingredients on screen, so it updates the moment a swap is saved.
  const flaggedCount = recipe.ingredients.filter((i) => i.contains_gluten).length;
  const swapsNeeded = recipe.ingredients.filter((i) => i.contains_gluten && !i.gf_substitute).length;
  const readyToMarkAdapted =
    recipe.gf_status === "needs_adapting" && flaggedCount > 0 && swapsNeeded === 0;

  return (
    <article className="space-y-8">
      <BackLink />

      {/* ---- Top: photo + title, status, actions ---- */}
      <header className="grid gap-6 md:grid-cols-[2fr_3fr] md:items-start">
        <div className="aspect-[4/3] overflow-hidden rounded-lg bg-pine-50">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-pine-600/50">
              <CookingPot size={56} strokeWidth={1.5} aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-sm text-ink-secondary">
              {recipe.source === "mealdb" ? "From TheMealDB" : "Family recipe"}
            </p>
            <h1 className="mt-1 text-[1.75rem] font-medium leading-tight">{recipe.title}</h1>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">Status</p>
            <StatusPicker value={recipe.gf_status} onChange={changeStatus} disabled={busy} />
            {swapsNeeded > 0 && (
              <p className="text-sm text-ink-secondary">
                {swapsNeeded} {swapsNeeded === 1 ? "ingredient needs" : "ingredients need"} a gluten-free swap.
              </p>
            )}
          </div>

          {actionError && <ErrorMessage message={actionError} />}

          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-error/30 p-3">
              <p className="mr-auto text-sm text-ink">Delete this recipe and its ingredients?</p>
              <button type="button" onClick={deleteRecipe} disabled={busy} className={btn.danger}>
                Delete recipe
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} disabled={busy} className={btn.secondary}>
                Keep it
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Link to={`/recipes/${recipe.id}/edit`} className={btn.secondary}>
                Edit details
              </Link>
              <button type="button" onClick={() => setConfirmDelete(true)} className={btn.secondary}>
                Delete
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ---- Prompt: every flagged ingredient has a swap ---- */}
      {readyToMarkAdapted && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-md border border-pine-100 bg-pine-50 p-4"
        >
          <CircleCheck size={20} className="shrink-0 text-primary" aria-hidden="true" />
          <p className="flex-1 text-sm text-ink">
            <span className="font-medium">All swaps added.</span> Mark this recipe as adapted?
          </p>
          <button type="button" onClick={() => changeStatus("adapted")} disabled={busy} className={btn.primary}>
            Mark as adapted
          </button>
        </div>
      )}

      <div className="max-w-3xl space-y-10">
        <IngredientList
          recipeId={recipe.id}
          ingredients={recipe.ingredients}
          onChange={(ingredients) => updateRecipe({ ingredients })}
        />

        <NotesEditor
          recipeId={recipe.id}
          notes={recipe.notes}
          onSaved={(updated) => updateRecipe({ notes: updated.notes })}
        />

        <section aria-labelledby="instructions-heading">
          <h2 id="instructions-heading" className="mb-3 text-xl font-medium">Instructions</h2>
          {recipe.instructions ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{recipe.instructions}</p>
          ) : (
            <p className="text-sm text-ink-secondary">No instructions yet.</p>
          )}
        </section>
      </div>
    </article>
  );
}

function BackLink() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-link hover:underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <ChevronLeft size={16} aria-hidden="true" />
      My recipes
    </Link>
  );
}