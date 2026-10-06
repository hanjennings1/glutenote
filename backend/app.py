"""
app.py — Flask routes (the REST API) for Glutenote.

Run from backend/ with the virtual environment active:
  python app.py
The API then runs at http://localhost:5555

Routes so far:
  GET    /recipes          list all recipes (optional ?status= filter)
  GET    /recipes/<id>     one recipe, including its ingredients
  POST   /recipes          create a recipe (optionally with ingredients)
  PATCH  /recipes/<id>     update some fields of a recipe
  DELETE /recipes/<id>     delete a recipe (and its ingredients, via cascade)

Error responses always use the shape {"error": "message"}
so the React frontend can display them the same way everywhere.
"""

from flask import request
from sqlalchemy.exc import IntegrityError

from config import app, db
from models import Recipe, Ingredient, GF_STATUSES

# Fields the frontend is allowed to set on a recipe.
# Anything else in the request body (like "id") is ignored,
# so users cannot overwrite fields they shouldn't control.
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

        # Optional: create ingredients in the same request.
        # Used when importing from TheMealDB, so the recipe and its
        # ingredients are saved together in one step.
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


if __name__ == "__main__":
    app.run(port=5555, debug=True)