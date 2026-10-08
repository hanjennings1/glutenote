// RecipeCard.jsx — One recipe in the My Recipes grid. The whole card is a link
// to the recipe's detail page.

import { useState } from "react";
import { Link } from "react-router-dom";
import { CookingPot } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function RecipeCard({ recipe }) {
  // If the photo is missing or fails to load, show a simple placeholder instead.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = recipe.image_url && !imageFailed;

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group block overflow-hidden rounded-lg border border-border bg-white shadow-card transition-colors hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="aspect-4/3 bg-pine-50">
        {showImage ? (
          <img
            src={recipe.image_url}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-pine-600/50">
            <CookingPot size={40} strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="space-y-2 p-4">
        <h2 className="text-base font-medium leading-snug group-hover:underline group-hover:underline-offset-2">
          {recipe.title}
        </h2>
        <StatusBadge status={recipe.gf_status} swapsNeeded={recipe.swaps_needed} />
        <p className="text-sm text-ink-secondary">
          {recipe.source === "mealdb" ? "From TheMealDB" : "Family recipe"}
        </p>
      </div>
    </Link>
  );
}