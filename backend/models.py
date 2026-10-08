"""
models.py — Database models for Glutenote.

Defines the two tables in the app:
  - Recipe:     a saved recipe (imported from TheMealDB or created by the user)
  - Ingredient: one ingredient line belonging to a recipe

Relationship: one Recipe has many Ingredients (one-to-many),
linked by the ingredients.recipe_id foreign key.

After changing anything in this file, update the database with:
  flask --app app db migrate -m "describe the change"
  flask --app app db upgrade
"""

from sqlalchemy.orm import validates
from config import db  # the shared SQLAlchemy instance created in config.py

# The only values allowed for Recipe.gf_status.
# Kept in one list so the validator (and later, routes) can reuse it.
GF_STATUSES = ["naturally_gf", "adapted", "needs_adapting"]


class Recipe(db.Model):
    __tablename__ = "recipes"

    # Primary key: auto-incrementing ID managed by PostgreSQL.
    # Used in routes like /recipes/<id> and by Ingredient.recipe_id.
    id = db.Column(db.Integer, primary_key=True)

    # Required: every recipe needs a title.
    title = db.Column(db.String, nullable=False)

    # Text (not String) because instructions and notes can be long.
    instructions = db.Column(db.Text)

    # Thumbnail URL from TheMealDB (strMealThumb); empty for most custom recipes.
    image_url = db.Column(db.String)

    # Where the recipe came from: "mealdb" (imported) or "custom" (user-created).
    source = db.Column(db.String, nullable=False, default="custom")

    # TheMealDB's own ID (idMeal) for imported recipes; None for custom recipes.
    # unique=True makes the database reject saving the same MealDB recipe twice.
    # (PostgreSQL allows many NULLs in a unique column, so custom recipes never conflict.)
    # This is NOT the primary key; it's only a reference to the external API.
    mealdb_id = db.Column(db.String, unique=True, nullable=True)

    # Gluten-free status; must be one of GF_STATUSES (enforced by the validator below).
    # Imported recipes with flagged ingredients start as "needs_adapting".
    gf_status = db.Column(db.String, nullable=False, default="needs_adapting")

    # The user's personal notes, e.g. "used 1:1 GF flour, came out great."
    notes = db.Column(db.Text)

    # Set automatically by the database when the row is created.
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # One-to-many link to this recipe's ingredients.
    #   recipe.ingredients -> list of Ingredient objects
    # back_populates pairs this with Ingredient.recipe so both sides stay in sync.
    # cascade="all, delete-orphan" deletes a recipe's ingredients automatically
    # when the recipe is deleted (and removes ingredients detached from a recipe).
    ingredients = db.relationship(
        "Ingredient", back_populates="recipe", cascade="all, delete-orphan"
    )

    # Runs every time gf_status is set (on create or update).
    # Raising ValueError lets routes catch bad input and return a 400 error
    # with a clear message instead of saving invalid data.
    @validates("gf_status")
    def validate_gf_status(self, key, value):
        if value not in GF_STATUSES:
            raise ValueError(f"gf_status must be one of {GF_STATUSES}")
        return value

    # Converts a Recipe into a plain dictionary so Flask can return it as JSON.
    # include_ingredients=False is used for the recipe list page,
    # which doesn't need every ingredient and keeps responses smaller.
    def to_dict(self, include_ingredients=True):
        data = {
            "id": self.id,
            "title": self.title,
            "instructions": self.instructions,
            "image_url": self.image_url,
            "source": self.source,
            "mealdb_id": self.mealdb_id,
            "gf_status": self.gf_status,
            "notes": self.notes,
            # How many flagged ingredients still have no gluten-free swap.
            # Shown on the "Needs adapting · 2" badge in the recipe list.
            # Calculated each time, so it's never out of date (not stored in the database).
            "swaps_needed": sum(
                1 for i in self.ingredients if i.contains_gluten and not i.gf_substitute
            ),
        }
        if include_ingredients:
            data["ingredients"] = [i.to_dict() for i in self.ingredients]
        return data


class Ingredient(db.Model):
    __tablename__ = "ingredients"

    # Primary key for each ingredient line.
    id = db.Column(db.Integer, primary_key=True)

    # Foreign key: which recipe this ingredient belongs to (points to recipes.id).
    # nullable=False because an ingredient can't exist without a recipe.
    recipe_id = db.Column(db.Integer, db.ForeignKey("recipes.id"), nullable=False)

    # Ingredient name, e.g. "plain flour". Required.
    name = db.Column(db.String, nullable=False)

    # Stored as text, not a number, because TheMealDB measurements look like
    # "1 cup", "2 tbsp", or "to taste" (from the strMeasure fields).
    amount = db.Column(db.String)

    # True if the gluten keyword check flagged this ingredient on import.
    # Users can edit this, since keyword matching isn't perfect
    # (e.g. "gluten-free flour" also matches the keyword "flour").
    contains_gluten = db.Column(db.Boolean, nullable=False, default=False)

    # The user's gluten-free replacement, e.g. "1:1 gluten-free flour blend".
    # Empty until the user records a substitution.
    gf_substitute = db.Column(db.String)

    # The other side of Recipe.ingredients:
    #   ingredient.recipe -> the Recipe object this ingredient belongs to
    recipe = db.relationship("Recipe", back_populates="ingredients")

    # Converts an Ingredient into a dictionary for JSON responses.
    # Doesn't include the full recipe, to avoid an endless loop
    # (recipe -> ingredients -> recipe -> ...).
    def to_dict(self):
        return {
            "id": self.id,
            "recipe_id": self.recipe_id,
            "name": self.name,
            "amount": self.amount,
            "contains_gluten": self.contains_gluten,
            "gf_substitute": self.gf_substitute,
        }