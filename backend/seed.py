"""
seed.py — Fills the database with sample recipes for development and testing.

Run from backend/ with the virtual environment active:
  python seed.py

WARNING: This deletes ALL existing recipes and ingredients first,
so only use it on the development database.

Includes one recipe for each gluten-free status, so the
status filter can be tested:
  - naturally_gf:   no gluten, no changes needed
  - adapted:        had gluten, every flagged ingredient has a substitute
  - needs_adapting: has flagged ingredients without substitutes yet
"""

from config import app, db
from models import Recipe, Ingredient

# Database operations need the Flask app context
# (it tells SQLAlchemy which database to use).
with app.app_context():
    print("Clearing existing data...")
    # Delete ingredients first, since they reference recipes via a foreign key.
    Ingredient.query.delete()
    Recipe.query.delete()

    print("Creating recipes...")

    # 1. Naturally gluten-free: no ingredients flagged.
    shakshuka = Recipe(
        title="Shakshuka",
        instructions=(
            "Saute onion and peppers in olive oil. Add garlic and spices, "
            "then crushed tomatoes. Simmer 10 minutes, make wells, crack in "
            "the eggs, cover, and cook until set."
        ),
        source="custom",
        gf_status="naturally_gf",
        notes="Naturally gluten-free. Serve with GF toast for dipping.",
        ingredients=[
            Ingredient(name="olive oil", amount="2 tbsp"),
            Ingredient(name="onion", amount="1, diced"),
            Ingredient(name="red bell pepper", amount="1, diced"),
            Ingredient(name="garlic", amount="3 cloves"),
            Ingredient(name="crushed tomatoes", amount="28 oz can"),
            Ingredient(name="eggs", amount="4"),
        ],
    )

    # 2. Adapted: the flour was flagged, and a substitute has been recorded.
    banana_bread = Recipe(
        title="Banana Bread",
        instructions=(
            "Mash bananas, mix in melted butter, sugar, egg, and vanilla. "
            "Stir in flour and baking soda. Bake at 350F for 55-60 minutes."
        ),
        source="custom",
        gf_status="adapted",
        notes="1:1 GF flour blend worked well. Needed about 5 extra minutes in the oven.",
        ingredients=[
            Ingredient(name="ripe bananas", amount="3"),
            Ingredient(name="butter", amount="1/3 cup, melted"),
            Ingredient(name="sugar", amount="3/4 cup"),
            Ingredient(name="egg", amount="1"),
            Ingredient(
                name="all-purpose flour",
                amount="1 1/2 cups",
                contains_gluten=True,
                gf_substitute="1:1 gluten-free flour blend",
            ),
            Ingredient(name="baking soda", amount="1 tsp"),
        ],
    )

    # 3. Needs adapting: soy sauce is flagged but has no substitute yet.
    # Soy sauce is a good test case, since its gluten (from wheat) is easy to miss.
    teriyaki = Recipe(
        title="Teriyaki Chicken",
        instructions=(
            "Whisk soy sauce, honey, garlic, and ginger. Brown the chicken, "
            "pour in the sauce, and simmer until thickened."
        ),
        source="custom",
        gf_status="needs_adapting",
        ingredients=[
            Ingredient(name="chicken thighs", amount="1 1/2 lbs"),
            Ingredient(name="soy sauce", amount="1/3 cup", contains_gluten=True),
            Ingredient(name="honey", amount="3 tbsp"),
            Ingredient(name="garlic", amount="2 cloves"),
            Ingredient(name="ginger", amount="1 tsp, grated"),
        ],
    )

    # Passing ingredients=[...] above links each Ingredient to its Recipe,
    # so adding the recipes also saves their ingredients.
    db.session.add_all([shakshuka, banana_bread, teriyaki])
    db.session.commit()

    print(f"Seeded {Recipe.query.count()} recipes and {Ingredient.query.count()} ingredients.")