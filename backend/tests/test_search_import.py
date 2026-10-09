"""
test_search_import.py — Tests for GET /search and POST /recipes/import.

These routes normally call TheMealDB over the internet. Here, monkeypatch
swaps in fake versions of search_meals() and lookup_meal(), so the tests are
fast, never need the internet, and can pretend TheMealDB is down.
"""

from mealdb import MealDBError

# A small fake TheMealDB recipe: one gluten ingredient, one gluten-free.
FAKE_MEAL = {
    "idMeal": "52771",
    "strMeal": "Spicy Arrabiata Penne",
    "strInstructions": "Boil the pasta. Make the sauce.",
    "strMealThumb": "https://example.com/penne.jpg",
    "strIngredient1": "penne rigate", "strMeasure1": "1 pound",
    "strIngredient2": "olive oil",    "strMeasure2": "1/4 cup",
}


def fake_search(query):
    return [FAKE_MEAL]


def fake_lookup(mealdb_id):
    return FAKE_MEAL if mealdb_id == "52771" else None


def mealdb_is_down(*args):
    raise MealDBError("TheMealDB is unavailable. Please try again.")


# ---------- GET /search ----------

def test_search_returns_previews_with_gluten_flags(client, monkeypatch):
    # app.py imported search_meals by name, so we replace it inside app.py.
    monkeypatch.setattr("app.search_meals", fake_search)

    response = client.get("/search?q=penne")

    results = response.get_json()
    assert response.status_code == 200
    assert results[0]["title"] == "Spicy Arrabiata Penne"
    assert results[0]["flagged_count"] == 1
    assert results[0]["saved"] is False


def test_search_marks_recipes_already_saved(client, monkeypatch):
    monkeypatch.setattr("app.search_meals", fake_search)
    monkeypatch.setattr("app.lookup_meal", fake_lookup)
    client.post("/recipes/import", json={"mealdb_id": "52771"})

    results = client.get("/search?q=penne").get_json()

    assert results[0]["saved"] is True


def test_search_without_a_term_returns_400(client):
    response = client.get("/search?q=")

    assert response.status_code == 400


def test_search_returns_502_when_mealdb_is_down(client, monkeypatch):
    monkeypatch.setattr("app.search_meals", mealdb_is_down)

    response = client.get("/search?q=penne")

    assert response.status_code == 502
    assert "unavailable" in response.get_json()["error"]


# ---------- POST /recipes/import ----------

def test_import_saves_recipe_with_flags(client, monkeypatch):
    monkeypatch.setattr("app.lookup_meal", fake_lookup)

    response = client.post("/recipes/import", json={"mealdb_id": "52771"})

    recipe = response.get_json()
    assert response.status_code == 201
    assert recipe["source"] == "mealdb"
    assert recipe["gf_status"] == "needs_adapting"   # penne was flagged
    assert recipe["swaps_needed"] == 1


def test_importing_the_same_recipe_twice_returns_409(client, monkeypatch):
    monkeypatch.setattr("app.lookup_meal", fake_lookup)
    client.post("/recipes/import", json={"mealdb_id": "52771"})

    response = client.post("/recipes/import", json={"mealdb_id": "52771"})

    assert response.status_code == 409
    assert response.get_json() == {"error": "This recipe is already in your collection"}


def test_import_unknown_recipe_returns_404(client, monkeypatch):
    monkeypatch.setattr("app.lookup_meal", fake_lookup)

    response = client.post("/recipes/import", json={"mealdb_id": "00000"})

    assert response.status_code == 404


def test_import_without_mealdb_id_returns_400(client):
    response = client.post("/recipes/import", json={})

    assert response.status_code == 400