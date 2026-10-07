"""
mealdb.py — Talks to TheMealDB API and converts its recipes into Glutenote's format.

TheMealDB docs: https://www.themealdb.com/api.php
The "1" in the base URL is TheMealDB's free test key for development.

Used by two routes in app.py:
  GET  /search?q=        -> search_meals() + parse_meal()  (previews, nothing saved)
  POST /recipes/import   -> lookup_meal()  + parse_meal()  (saved to the database)
"""

import requests

from gluten import may_contain_gluten

BASE_URL = "https://www.themealdb.com/api/json/v1/1"

# Seconds to wait before giving up, so a slow TheMealDB never hangs our app.
TIMEOUT = 8

# TheMealDB stores ingredients in numbered fields: strIngredient1..20, strMeasure1..20.
MAX_INGREDIENTS = 20


class MealDBError(Exception):
    """Raised when TheMealDB can't be reached or sends back something unusable.
    Routes catch this and return a 502 error to the frontend."""


def _get(endpoint, params):
    """Make a GET request to TheMealDB and return its list of meals.

    Returns [] when there are no matches (TheMealDB sends {"meals": null}).
    Raises MealDBError for network problems, timeouts, or bad responses.
    """
    try:
        response = requests.get(f"{BASE_URL}/{endpoint}", params=params, timeout=TIMEOUT)
        response.raise_for_status()  # turns 4xx/5xx status codes into errors
        data = response.json()
    except (requests.RequestException, ValueError) as e:
        # RequestException covers timeouts and connection errors;
        # ValueError covers a response that isn't valid JSON.
        raise MealDBError("TheMealDB is unavailable. Please try again.") from e

    return data.get("meals") or []


def search_meals(query):
    """Search TheMealDB by meal name. Returns a list of raw meal dicts (may be empty)."""
    return _get("search.php", {"s": query})


def lookup_meal(mealdb_id):
    """Get one full meal by TheMealDB ID. Returns the raw meal dict, or None if not found."""
    meals = _get("lookup.php", {"i": mealdb_id})
    return meals[0] if meals else None


def _clean(value):
    """TheMealDB uses None, "", or "  " for empty fields. Return a stripped string or None."""
    if value is None:
        return None
    value = str(value).strip()
    return value or None


def parse_meal(meal):
    """Convert a raw TheMealDB meal into Glutenote's recipe format, with gluten flags.

    Example output:
    {
        "mealdb_id": "52771",
        "title": "Spicy Arrabiata Penne",
        "instructions": "...",
        "image_url": "https://...jpg",
        "ingredients": [
            {"name": "penne rigate", "amount": "1 pound", "contains_gluten": False},
            ...
        ],
        "flagged_count": 0,
        "gf_status": "naturally_gf",
    }
    """
    ingredients = []

    # Loop through the numbered fields, skipping the empty slots.
    for i in range(1, MAX_INGREDIENTS + 1):
        name = _clean(meal.get(f"strIngredient{i}"))
        if not name:
            continue
        ingredients.append({
            "name": name,
            "amount": _clean(meal.get(f"strMeasure{i}")),
            "contains_gluten": may_contain_gluten(name),
        })

    flagged_count = sum(1 for ing in ingredients if ing["contains_gluten"])

    return {
        "mealdb_id": _clean(meal.get("idMeal")),
        "title": _clean(meal.get("strMeal")) or "Untitled recipe",
        "instructions": _clean(meal.get("strInstructions")),
        "image_url": _clean(meal.get("strMealThumb")),
        "ingredients": ingredients,
        "flagged_count": flagged_count,
        # Starting status, per the pitch's Gluten Flagging Rules.
        "gf_status": "needs_adapting" if flagged_count else "naturally_gf",
    }