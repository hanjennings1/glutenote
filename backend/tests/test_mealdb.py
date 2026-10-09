"""
test_mealdb.py — Tests for parse_meal() in mealdb.py.

parse_meal() turns one raw TheMealDB recipe into Glutenote's format
and flags gluten. These tests use small, hand-made recipes shaped like
TheMealDB's, so no internet is needed.
"""

from mealdb import parse_meal


def make_meal(**fields):
    """Build a fake TheMealDB meal. TheMealDB always sends all 20
    ingredient and measure slots, using "" or None for unused ones."""
    meal = {
        "idMeal": "12345",
        "strMeal": "Test Recipe",
        "strInstructions": "Mix and bake.",
        "strMealThumb": "https://example.com/photo.jpg",
    }
    for i in range(1, 21):
        meal[f"strIngredient{i}"] = ""
        meal[f"strMeasure{i}"] = ""
    meal.update(fields)
    return meal


def test_recipe_with_gluten_starts_as_needs_adapting():
    meal = make_meal(
        strIngredient1="Plain Flour", strMeasure1="200g",
        strIngredient2="Butter", strMeasure2="100g",
    )
    parsed = parse_meal(meal)

    assert parsed["mealdb_id"] == "12345"
    assert parsed["title"] == "Test Recipe"
    assert parsed["flagged_count"] == 1
    assert parsed["gf_status"] == "needs_adapting"
    assert parsed["ingredients"][0] == {
        "name": "Plain Flour", "amount": "200g", "contains_gluten": True,
    }
    assert parsed["ingredients"][1]["contains_gluten"] is False


def test_recipe_without_gluten_starts_as_naturally_gf():
    meal = make_meal(strIngredient1="Eggs", strIngredient2="Tomatoes")
    parsed = parse_meal(meal)

    assert parsed["flagged_count"] == 0
    assert parsed["gf_status"] == "naturally_gf"


def test_empty_ingredient_slots_are_skipped():
    # Slots 2 and 3 are blank or just spaces; slot 4 has an ingredient again.
    meal = make_meal(
        strIngredient1="Rice",
        strIngredient2="   ",
        strIngredient3=None,
        strIngredient4="Salt",
    )
    parsed = parse_meal(meal)

    names = [i["name"] for i in parsed["ingredients"]]
    assert names == ["Rice", "Salt"]


def test_blank_measure_becomes_none():
    meal = make_meal(strIngredient1="Salt", strMeasure1=" ")
    parsed = parse_meal(meal)

    assert parsed["ingredients"][0]["amount"] is None


def test_missing_title_gets_a_placeholder():
    meal = make_meal(strMeal="")
    parsed = parse_meal(meal)

    assert parsed["title"] == "Untitled recipe"