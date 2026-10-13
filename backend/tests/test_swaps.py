"""
test_swaps.py — Tests for GET /swaps, which gathers the gluten-free swaps
saved across all recipes (for the suggestions and the My Swaps page).
"""


def add_recipe(client, title, ingredients):
    """Helper: save a recipe with ingredients, given as (name, contains_gluten, swap) tuples."""
    response = client.post("/recipes", json={
        "title": title,
        "ingredients": [
            {"name": name, "contains_gluten": flagged, "gf_substitute": swap}
            for name, flagged, swap in ingredients
        ],
    })
    assert response.status_code == 201


def test_no_swaps_yet_returns_empty_list(client):
    add_recipe(client, "Toast", [("bread", True, None)])   # flagged, but no swap yet

    response = client.get("/swaps")

    assert response.status_code == 200
    assert response.get_json() == []


def test_same_swap_in_two_recipes_is_grouped(client):
    add_recipe(client, "Banana Bread", [("All-purpose flour", True, "1:1 GF flour blend")])
    add_recipe(client, "Apple Crumble", [("all-purpose flour", True, "1:1 gf flour blend")])

    swaps = client.get("/swaps").get_json()

    assert len(swaps) == 1                       # grouped, ignoring capitalization
    assert swaps[0]["times_used"] == 2
    assert sorted(r["title"] for r in swaps[0]["recipes"]) == ["Apple Crumble", "Banana Bread"]


def test_most_used_swaps_come_first(client):
    add_recipe(client, "Teriyaki", [("soy sauce", True, "tamari")])
    add_recipe(client, "Banana Bread", [("flour", True, "rice flour")])
    add_recipe(client, "Pancakes", [("flour", True, "rice flour")])

    swaps = client.get("/swaps").get_json()

    assert [s["substitute"] for s in swaps] == ["rice flour", "tamari"]


def test_unflagged_ingredients_are_not_swaps(client):
    add_recipe(client, "Salad", [("lettuce", False, "spinach")])

    assert client.get("/swaps").get_json() == []


def test_suggestions_match_a_shared_gluten_keyword(client):
    add_recipe(client, "Banana Bread", [("all-purpose flour", True, "1:1 GF flour blend")])
    add_recipe(client, "Teriyaki", [("soy sauce", True, "tamari")])

    # "plain flour" isn't the same text as "all-purpose flour", but both contain "flour"
    swaps = client.get("/swaps?ingredient=plain flour").get_json()

    assert [s["substitute"] for s in swaps] == ["1:1 GF flour blend"]


def test_suggestions_match_the_same_name(client):
    # "rolled oats" isn't a gluten keyword, but the exact same name still matches
    add_recipe(client, "Granola", [("Rolled oats", True, "certified GF oats")])

    swaps = client.get("/swaps?ingredient=rolled oats").get_json()

    assert [s["substitute"] for s in swaps] == ["certified GF oats"]


def test_no_suggestions_for_unrelated_ingredients(client):
    add_recipe(client, "Banana Bread", [("all-purpose flour", True, "1:1 GF flour blend")])

    assert client.get("/swaps?ingredient=soy sauce").get_json() == []