"""
app.py — Flask routes (the REST API) for Glutenote.

Run from backend/ with the virtual environment active:
  python app.py
The API then runs at http://localhost:5555

Routes:
  GET    /recipes            list all recipes (optional ?status= filter)
  GET    /recipes/<id>       one recipe, including its ingredients
  POST   /recipes            create a recipe (optionally with ingredients)
  PATCH  /recipes/<id>       update some fields of a recipe
  DELETE /recipes/<id>       delete a recipe (and its ingredients, via cascade)

  POST   /ingredients        add an ingredient to a recipe (needs recipe_id)
  PATCH  /ingredients/<id>   update an ingredient (e.g. record a GF substitute)
  DELETE /ingredients/<id>   delete an ingredient

  GET    /search?q=          search TheMealDB; returns previews with gluten flags (nothing saved)
  POST   /recipes/import     fetch a recipe from TheMealDB, flag gluten, and save it

Error responses always use the shape {"error": "message"}
so the React frontend can display them the same way everywhere.
"""

from flask import request
from sqlalchemy.exc import IntegrityError

from config import app, db
from models import Recipe, Ingredient, GF_STATUSES
from mealdb import search_meals, lookup_meal, parse_meal, MealDBError

# Fields the frontend is allowed to set on a recipe.
# Anything else in the request body (like "id") is ignored,
# so users can't overwrite fields they shouldn't control.
RECIPE_FIELDS = ["title", "instructions", "image_url", "source", "mealdb_id", "gf_status", "notes"]


@app.route("/")
def index():
    # Simple health check: confirms the API is running.
    return {"message": "Glutenote API is running"}


# ---------- Recipes: collection routes ----------

@app.route("/recipes", methods=["GET"])
def get_recipes():
    # Optional filter, e.g. /recipes?status=adapted
    status = request.args.get("status")
    query = Recipe.query

    if status:
        if status not in GF_STATUSES:
            return {"error": f"status must be one of {GF_STATUSES}"}, 400
        query = query.filter_by(gf_status=status)

    # Newest first. include_ingredients=False keeps the list response small,
    # since the My Recipes page only needs titles, images, and statuses.
    recipes = query.order_by(Recipe.created_at.desc()).all()
    return [r.to_dict(include_ingredients=False) for r in recipes], 200


@app.route("/recipes", methods=["POST"])
def create_recipe():
    # silent=True returns None instead of crashing if the body isn't valid JSON.
    data = request.get_json(silent=True)
    if not data:
        return {"error": "Request body must be JSON"}, 400
    if not data.get("title"):
        return {"error": "Title is required"}, 400

    try:
        # Copy only the allowed fields that were actually sent.
        recipe = Recipe(**{f: data[f] for f in RECIPE_FIELDS if f in data})

        # Optional: create ingredients in the same request,
        # so a custom recipe and its ingredients are saved in one step.
        for item in data.get("ingredients", []):
            if not item.get("name"):
                return {"error": "Each ingredient needs a name"}, 400
            recipe.ingredients.append(Ingredient(
                name=item["name"],
                amount=item.get("amount"),
                contains_gluten=item.get("contains_gluten", False),
                gf_substitute=item.get("gf_substitute"),
            ))

        db.session.add(recipe)
        db.session.commit()
        return recipe.to_dict(), 201  # 201 = Created

    except ValueError as e:
        # Raised by the gf_status validator in models.py.
        db.session.rollback()
        return {"error": str(e)}, 400
    except IntegrityError:
        # Raised when mealdb_id isn't unique (recipe already saved).
        db.session.rollback()
        return {"error": "This recipe is already in your collection"}, 409  # 409 = Conflict


# ---------- Recipes: single-recipe routes ----------

@app.route("/recipes/<int:id>", methods=["GET"])
def get_recipe(id):
    recipe = db.session.get(Recipe, id)
    if not recipe:
        return {"error": "Recipe not found"}, 404
    return recipe.to_dict(), 200  # includes ingredients for the detail page


@app.route("/recipes/<int:id>", methods=["PATCH"])
def update_recipe(id):
    recipe = db.session.get(Recipe, id)
    if not recipe:
        return {"error": "Recipe not found"}, 404

    data = request.get_json(silent=True)
    if not data:
        return {"error": "Request body must be JSON"}, 400
    if "title" in data and not data["title"]:
        return {"error": "Title cannot be empty"}, 400

    try:
        # PATCH updates only the fields that were sent; everything else stays the same.
        for field in RECIPE_FIELDS:
            if field in data:
                setattr(recipe, field, data[field])
        db.session.commit()
        return recipe.to_dict(), 200

    except ValueError as e:
        db.session.rollback()
        return {"error": str(e)}, 400
    except IntegrityError:
        db.session.rollback()
        return {"error": "Another recipe already uses that mealdb_id"}, 409


@app.route("/recipes/<int:id>", methods=["DELETE"])
def delete_recipe(id):
    recipe = db.session.get(Recipe, id)
    if not recipe:
        return {"error": "Recipe not found"}, 404

    # cascade="all, delete-orphan" in models.py removes its ingredients too.
    db.session.delete(recipe)
    db.session.commit()
    return {}, 204  # 204 = No Content (success, nothing to return)


# ---------- Ingredients ----------
# Ingredients are read through GET /recipes/<id>, which includes them,
# so these routes cover create, update, and delete.

# Fields the frontend is allowed to set on an ingredient.
# recipe_id is left out on purpose: an ingredient can't be moved to another recipe.
INGREDIENT_FIELDS = ["name", "amount", "contains_gluten", "gf_substitute"]


@app.route("/ingredients", methods=["POST"])
def create_ingredient():
    data = request.get_json(silent=True)
    if not data:
        return {"error": "Request body must be JSON"}, 400

    # The ingredient must belong to a recipe that exists.
    recipe = db.session.get(Recipe, data.get("recipe_id"))
    if not recipe:
        return {"error": "A valid recipe_id is required"}, 400
    if not data.get("name"):
        return {"error": "Ingredient name is required"}, 400
    if "contains_gluten" in data and not isinstance(data["contains_gluten"], bool):
        return {"error": "contains_gluten must be true or false"}, 400

    ingredient = Ingredient(
        recipe_id=recipe.id,
        name=data["name"],
        amount=data.get("amount"),
        contains_gluten=data.get("contains_gluten", False),
        gf_substitute=data.get("gf_substitute"),
    )
    db.session.add(ingredient)
    db.session.commit()
    return ingredient.to_dict(), 201


@app.route("/ingredients/<int:id>", methods=["PATCH"])
def update_ingredient(id):
    ingredient = db.session.get(Ingredient, id)
    if not ingredient:
        return {"error": "Ingredient not found"}, 404

    data = request.get_json(silent=True)
    if not data:
        return {"error": "Request body must be JSON"}, 400
    if "name" in data and not data["name"]:
        return {"error": "Ingredient name cannot be empty"}, 400
    if "contains_gluten" in data and not isinstance(data["contains_gluten"], bool):
        return {"error": "contains_gluten must be true or false"}, 400

    # Only update the fields that were sent. This is the route the
    # Recipe Detail page will use to save a gluten-free substitute.
    for field in INGREDIENT_FIELDS:
        if field in data:
            setattr(ingredient, field, data[field])
    db.session.commit()
    return ingredient.to_dict(), 200


@app.route("/ingredients/<int:id>", methods=["DELETE"])
def delete_ingredient(id):
    ingredient = db.session.get(Ingredient, id)
    if not ingredient:
        return {"error": "Ingredient not found"}, 404

    db.session.delete(ingredient)
    db.session.commit()
    return {}, 204


# ---------- TheMealDB: search and import ----------

@app.route("/search", methods=["GET"])
def search():
    # e.g. /search?q=lasagne
    query = request.args.get("q", "").strip()
    if not query:
        return {"error": "Please enter a search term"}, 400

    try:
        meals = search_meals(query)
    except MealDBError as e:
        return {"error": str(e)}, 502  # 502 = an outside service failed

    previews = [parse_meal(meal) for meal in meals]

    # Mark results that are already in the collection,
    # so the Search page can show "Saved" instead of a Save button.
    ids = [p["mealdb_id"] for p in previews]
    saved_ids = {
        r.mealdb_id for r in Recipe.query.filter(Recipe.mealdb_id.in_(ids)).all()
    } if ids else set()
    for p in previews:
        p["saved"] = p["mealdb_id"] in saved_ids

    # An empty list (no matches) is still a successful search.
    return previews, 200


@app.route("/recipes/import", methods=["POST"])
def import_recipe():
    data = request.get_json(silent=True) or {}
    mealdb_id = str(data.get("mealdb_id") or "").strip()
    if not mealdb_id:
        return {"error": "mealdb_id is required"}, 400

    # Check for a duplicate before calling TheMealDB, to save a request.
    if Recipe.query.filter_by(mealdb_id=mealdb_id).first():
        return {"error": "This recipe is already in your collection"}, 409

    try:
        meal = lookup_meal(mealdb_id)
    except MealDBError as e:
        return {"error": str(e)}, 502
    if not meal:
        return {"error": "Recipe not found in TheMealDB"}, 404

    # Convert TheMealDB's format, flag gluten, and pick the starting status.
    parsed = parse_meal(meal)
    recipe = Recipe(
        title=parsed["title"],
        instructions=parsed["instructions"],
        image_url=parsed["image_url"],
        source="mealdb",
        mealdb_id=parsed["mealdb_id"],
        gf_status=parsed["gf_status"],
    )
    for item in parsed["ingredients"]:
        recipe.ingredients.append(Ingredient(**item))

    try:
        db.session.add(recipe)
        db.session.commit()
    except IntegrityError:
        # Backup check: the database's unique rule on mealdb_id
        # catches a duplicate that slipped past the check above.
        db.session.rollback()
        return {"error": "This recipe is already in your collection"}, 409

    return recipe.to_dict(), 201


if __name__ == "__main__":
    app.run(port=5555, debug=True)