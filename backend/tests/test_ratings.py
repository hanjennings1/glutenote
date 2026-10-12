"""
test_ratings.py — Tests for rating recipes from 1 to 5 stars.

A rating is saved with PATCH /recipes/<id> {"rating": 4},
cleared with {"rating": null}, and used by GET /recipes?sort=rating.
"""

import pytest


def create_recipe(client, title="Banana Bread", **fields):
    response = client.post("/recipes", json={"title": title, **fields})
    assert response.status_code == 201
    return response.get_json()


def test_new_recipes_start_unrated(client):
    recipe = create_recipe(client)

    assert recipe["rating"] is None


def test_rate_a_recipe(client):
    recipe = create_recipe(client)

    response = client.patch(f"/recipes/{recipe['id']}", json={"rating": 4})

    assert response.status_code == 200
    assert response.get_json()["rating"] == 4


def test_clear_a_rating(client):
    recipe = create_recipe(client, rating=5)

    response = client.patch(f"/recipes/{recipe['id']}", json={"rating": None})

    assert response.get_json()["rating"] is None


@pytest.mark.parametrize("bad_rating", [0, 6, 3.5, "five", True])
def test_invalid_ratings_return_400(client, bad_rating):
    recipe = create_recipe(client)

    response = client.patch(f"/recipes/{recipe['id']}", json={"rating": bad_rating})

    assert response.status_code == 400
    assert "rating must be" in response.get_json()["error"]


def test_sort_by_rating_puts_unrated_recipes_last(client):
    create_recipe(client, "Okay Soup", rating=3)
    create_recipe(client, "Not Tried Yet")
    create_recipe(client, "Favorite Cake", rating=5)

    response = client.get("/recipes?sort=rating")

    titles = [r["title"] for r in response.get_json()["recipes"]]
    assert titles == ["Favorite Cake", "Okay Soup", "Not Tried Yet"]