"""
test_recipe_list.py — Tests for searching, sorting, and paginating GET /recipes.

The My Recipes page asks for one page of recipes at a time, e.g.
  /recipes?q=bread&sort=title&page=1&per_page=12
and the response includes the recipes plus page details (total, pages).
"""


def add_recipes(client, *titles):
    """Helper: save one recipe per title, in the order given."""
    for title in titles:
        response = client.post("/recipes", json={"title": title})
        assert response.status_code == 201


def titles_in(response):
    return [r["title"] for r in response.get_json()["recipes"]]


# ---------- Pagination ----------

def test_response_includes_page_details(client):
    add_recipes(client, "Shakshuka", "Banana Bread", "Pad Thai")

    data = client.get("/recipes").get_json()

    assert data["page"] == 1
    assert data["per_page"] == 12          # the default page size
    assert data["total"] == 3
    assert data["pages"] == 1
    assert len(data["recipes"]) == 3


def test_recipes_are_split_into_pages(client):
    add_recipes(client, "A", "B", "C", "D", "E")

    page1 = client.get("/recipes?sort=title&per_page=2&page=1").get_json()
    page3 = client.get("/recipes?sort=title&per_page=2&page=3").get_json()

    assert [r["title"] for r in page1["recipes"]] == ["A", "B"]
    assert [r["title"] for r in page3["recipes"]] == ["E"]   # last page can be shorter
    assert page1["total"] == 5
    assert page1["pages"] == 3


def test_page_past_the_end_is_empty_not_an_error(client):
    add_recipes(client, "A", "B")

    response = client.get("/recipes?page=5")

    assert response.status_code == 200
    assert response.get_json()["recipes"] == []


def test_invalid_page_values_return_400(client):
    assert client.get("/recipes?page=0").status_code == 400
    assert client.get("/recipes?page=abc").status_code == 400
    assert client.get("/recipes?per_page=500").status_code == 400


# ---------- Search ----------

def test_search_matches_any_part_of_the_title_ignoring_case(client):
    add_recipes(client, "Banana Bread", "Garlic Bread Rolls", "Shakshuka")

    response = client.get("/recipes?q=BREAD")

    assert sorted(titles_in(response)) == ["Banana Bread", "Garlic Bread Rolls"]
    assert response.get_json()["total"] == 2   # total counts matches, not all recipes


def test_search_and_status_filter_work_together(client):
    client.post("/recipes", json={"title": "Banana Bread", "gf_status": "adapted"})
    client.post("/recipes", json={"title": "Garlic Bread", "gf_status": "needs_adapting"})

    response = client.get("/recipes?q=bread&status=adapted")

    assert titles_in(response) == ["Banana Bread"]


# ---------- Sort ----------

def test_sort_by_title(client):
    add_recipes(client, "Shakshuka", "Banana Bread", "Pad Thai")

    response = client.get("/recipes?sort=title")

    assert titles_in(response) == ["Banana Bread", "Pad Thai", "Shakshuka"]


def test_newest_and_oldest_are_opposite_orders(client):
    add_recipes(client, "First", "Second", "Third")

    newest = titles_in(client.get("/recipes?sort=newest"))
    oldest = titles_in(client.get("/recipes?sort=oldest"))

    assert newest == ["Third", "Second", "First"]
    assert oldest == ["First", "Second", "Third"]


def test_unknown_sort_returns_400(client):
    response = client.get("/recipes?sort=spiciest")

    assert response.status_code == 400
    assert "sort must be one of" in response.get_json()["error"]