"""
test_routes.py — Tests for the recipe and ingredient routes in app.py.

Each test gets an empty database (see conftest.py), sends requests
with the test client, and checks the status code and the JSON that comes back.
"""

from models import Ingredient


def create_recipe(client, **fields):
    """Helper: create a recipe through the API and return its JSON."""
    body = {"title": "Banana Bread", "gf_status": "needs_adapting", **fields}
    response = client.post("/recipes", json=body)
    assert response.status_code == 201
    return response.get_json()


# ---------- Recipes ----------

def test_create_recipe_with_ingredients(client):
    recipe = create_recipe(client, ingredients=[
        {"name": "Plain flour", "amount": "2 cups", "contains_gluten": True},
        {"name": "Bananas", "amount": "3"},
    ])

    assert recipe["title"] == "Banana Bread"
    assert recipe["source"] == "custom"            # default when not sent
    assert len(recipe["ingredients"]) == 2
    assert recipe["swaps_needed"] == 1             # flour is flagged, no swap yet


def test_create_recipe_without_title_returns_400(client):
    response = client.post("/recipes", json={"instructions": "Mix."})

    assert response.status_code == 400
    assert response.get_json() == {"error": "Title is required"}


def test_create_recipe_with_bad_status_returns_400(client):
    response = client.post("/recipes", json={"title": "Toast", "gf_status": "mostly_gf"})

    assert response.status_code == 400
    assert "gf_status must be one of" in response.get_json()["error"]


def test_get_missing_recipe_returns_404(client):
    response = client.get("/recipes/999")

    assert response.status_code == 404
    assert response.get_json() == {"error": "Recipe not found"}


def test_filter_recipes_by_status(client):
    create_recipe(client, title="Shakshuka", gf_status="naturally_gf")
    create_recipe(client, title="Banana Bread", gf_status="needs_adapting")

    response = client.get("/recipes?status=naturally_gf")

    titles = [r["title"] for r in response.get_json()]
    assert response.status_code == 200
    assert titles == ["Shakshuka"]


def test_filter_with_unknown_status_returns_400(client):
    response = client.get("/recipes?status=proven")

    assert response.status_code == 400


def test_patch_updates_only_the_fields_sent(client):
    recipe = create_recipe(client, notes="Old note")

    response = client.patch(f"/recipes/{recipe['id']}", json={"notes": "Used 1:1 GF flour"})

    updated = response.get_json()
    assert response.status_code == 200
    assert updated["notes"] == "Used 1:1 GF flour"
    assert updated["title"] == "Banana Bread"      # unchanged


def test_patch_with_empty_title_returns_400(client):
    recipe = create_recipe(client)

    response = client.patch(f"/recipes/{recipe['id']}", json={"title": ""})

    assert response.status_code == 400


def test_delete_recipe_also_deletes_its_ingredients(client):
    recipe = create_recipe(client, ingredients=[{"name": "Flour"}, {"name": "Sugar"}])

    response = client.delete(f"/recipes/{recipe['id']}")

    assert response.status_code == 204
    assert client.get(f"/recipes/{recipe['id']}").status_code == 404
    assert Ingredient.query.count() == 0           # cascade delete worked


# ---------- Ingredients ----------

def test_add_ingredient_to_recipe(client):
    recipe = create_recipe(client)

    response = client.post("/ingredients", json={
        "recipe_id": recipe["id"], "name": "Rolled oats", "contains_gluten": True,
    })

    assert response.status_code == 201
    assert response.get_json()["recipe_id"] == recipe["id"]


def test_add_ingredient_without_valid_recipe_returns_400(client):
    response = client.post("/ingredients", json={"recipe_id": 999, "name": "Flour"})

    assert response.status_code == 400
    assert response.get_json() == {"error": "A valid recipe_id is required"}


def test_contains_gluten_must_be_true_or_false(client):
    recipe = create_recipe(client)

    response = client.post("/ingredients", json={
        "recipe_id": recipe["id"], "name": "Flour", "contains_gluten": "yes",
    })

    assert response.status_code == 400


def test_recording_a_swap_lowers_swaps_needed(client):
    recipe = create_recipe(client, ingredients=[
        {"name": "Plain flour", "contains_gluten": True},
    ])
    flour_id = recipe["ingredients"][0]["id"]
    assert recipe["swaps_needed"] == 1

    # This is what the Recipe Detail page sends when a swap is saved.
    client.patch(f"/ingredients/{flour_id}", json={"gf_substitute": "1:1 GF flour blend"})

    after = client.get(f"/recipes/{recipe['id']}").get_json()
    assert after["swaps_needed"] == 0
    assert after["ingredients"][0]["gf_substitute"] == "1:1 GF flour blend"


def test_delete_ingredient(client):
    recipe = create_recipe(client, ingredients=[{"name": "Flour"}])
    ingredient_id = recipe["ingredients"][0]["id"]

    response = client.delete(f"/ingredients/{ingredient_id}")

    assert response.status_code == 204
    assert client.get(f"/recipes/{recipe['id']}").get_json()["ingredients"] == []