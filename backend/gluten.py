"""
gluten.py — Flags ingredients that may contain gluten.

Used when previewing TheMealDB search results and when importing a recipe.
The rules here match the "Gluten Flagging Rules" section of the project pitch.

This is a keyword check, so it is a helpful guide, NOT a guarantee.
Users can turn any flag on or off in the app, and the app reminds them
to always check product labels.

Quick test (from backend/ with the venv active):
  python -c "from gluten import may_contain_gluten as g; print(g('Plain Flour'), g('Rice Flour'), g('Kale'))"
  -> True False False
"""

import re

# Ingredient words that usually mean gluten.
# Plural forms (e.g. "crackers", "tortillas") are matched automatically below.
GLUTEN_KEYWORDS = [
    "flour", "wheat", "bread", "breadcrumbs", "panko",
    "pasta", "spaghetti", "macaroni", "lasagne", "noodles",
    "penne", "linguine", "fettuccine", "tagliatelle", "rigatoni",
    "farfalle", "fusilli", "orzo", "ravioli", "tortellini", "gnocchi",
    "baguette", "ciabatta", "brioche", "naan", "bun",
    "couscous", "bulgur", "semolina", "barley", "rye",
    "spelt", "farro", "seitan", "pastry", "filo",
    "tortilla", "pita", "cracker", "biscuit",
    "soy sauce", "teriyaki", "beer", "ale", "malt",
]

# Gluten-free varieties that would otherwise match a keyword above
# (e.g. "rice flour" contains "flour"). Checked BEFORE the keywords.
GF_EXCEPTIONS = [
    "gluten-free", "gluten free",
    "rice flour", "almond flour", "coconut flour",
    "corn flour", "cornflour", "buckwheat",
    "rice noodles", "tamari",
]

# Pre-built patterns that match WHOLE WORDS only, ignoring capitalization.
#   \b      = word boundary, so "ale" matches "Pale Ale" but not "Kale",
#             and "wheat" does not match inside "buckwheat"
#   (?:e?s)? = optional plural ending: "cracker" also matches "crackers"
_KEYWORD_PATTERNS = [
    re.compile(rf"\b{re.escape(word)}(?:e?s)?\b", re.IGNORECASE)
    for word in GLUTEN_KEYWORDS
]


def may_contain_gluten(ingredient_name):
    """Return True if the ingredient name suggests it may contain gluten."""
    if not ingredient_name:
        return False

    name = ingredient_name.lower()

    # 1. Known gluten-free varieties are never flagged.
    if any(exception in name for exception in GF_EXCEPTIONS):
        return False

    # 2. Otherwise, flag it if any gluten keyword appears as a whole word.
    return any(pattern.search(name) for pattern in _KEYWORD_PATTERNS)