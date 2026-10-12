// StarRating.jsx — 1 to 5 stars for a recipe.
//
// Two ways to use it:
//   <StarRating value={4} />                      read-only (e.g. on recipe cards)
//   <StarRating value={4} onChange={save} />      clickable (on Recipe Detail)
//
// Stars are pine, not yellow, to stay within the style guide's colors.

import { useState } from "react";
import { Star } from "lucide-react";

const STARS = [1, 2, 3, 4, 5];

export default function StarRating({ value, onChange, disabled = false, size = 20}) {
    // while mouse is over a star, preview that rating
    const [hovered, setHovered] = useState(null);

    // Read-Only: one label for the whole row, since the stars are not buttons
    if (!onChange) {
        return (
            <span role="img" aria-label={`Rated ${value} out of 5`} className="inline-flex gap-0.5 text-primary">
                {STARS.map((n) => (
                    <Star key={n} size={size} fill={n <= value ? "currentColor" : "none"} aria-hidden="true" />
                ))}
            </span>
        );
    }

    const shown = hovered ?? value ?? 0;

    return (
        <div
            role="radiogroup"
            aria-label="Rating"
            className="inline-flex gap-0.5"
            onMouseLeave={() => setHovered(null)}
        >
            {STARS.map((n) => (
                <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={value === n}
                    aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                    disabled={disabled}
                    onClick={() => onChange(n)}
                    onMouseEnter={() => setHovered(n)}
                    className="rounded-sm p-0.5 text-primary transition-transform hover:scale-110 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    <Star size={size} fill={n <= shown ? "currentColor" : "none"} aria-hidden="true" />
                </button>
            ))}
        </div>
    );
}