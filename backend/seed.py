"""
seed.py — Fills the database with sample recipes for development and testing.

Run from backend/ with the virtual environment active:
  python seed.py

WARNING: This deletes ALL existing recipes and ingredients first,
so only use it on the development database.

Includes recipes for each gluten-free status, so the status filter can be tested:
  - naturally_gf:   no gluten, no changes needed
  - adapted:        had gluten, every flagged ingredient has a substitute
  - needs_adapting: has flagged ingredients without substitutes yet

Also shows off the newer features:
  - ratings:         some recipes are rated, some aren't (try "Highest rated")
  - My Swaps:        the flour swap is used in two recipes, so it's grouped
  - suggested swaps: Lemon Bars has unswapped flour; click "Add swap" to see
                     "Used before: 1:1 gluten-free flour blend"
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
        rating=5,
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
        notes="1:1 GF flour blend worked well; just let the dough sit an extra 10 mins before putting in oven.",
        rating=4,
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

    # 4. Adapted: uses the same flour swap as Banana Bread, plus an oats swap,
    # so My Swaps shows the flour blend "used in 2 recipes".
    apple_crumble = Recipe(
        title="Apple Crumble",
        instructions=(
            "Toss sliced apples with sugar and cinnamon. Rub flour, oats, and butter "
            "into a crumble, sprinkle over the apples, and bake at 375F for 40 minutes."
        ),
        source="custom",
        gf_status="adapted",
        notes="Certified GF oats are a must. Regular oats are often cross-contaminated.",
        rating=5,
        ingredients=[
            Ingredient(name="apples", amount="6, sliced"),
            Ingredient(name="sugar", amount="1/2 cup"),
            Ingredient(name="cinnamon", amount="1 tsp"),
            Ingredient(
                name="all-purpose flour",
                amount="3/4 cup",
                contains_gluten=True,
                gf_substitute="1:1 gluten-free flour blend",
            ),
            Ingredient(
                name="rolled oats",
                amount="3/4 cup",
                contains_gluten=True,
                gf_substitute="certified gluten-free oats",
            ),
            Ingredient(name="butter", amount="1/2 cup, cold"),
        ],
    )

    # 5. Needs adapting: the flour has no swap yet. Clicking "Add swap" on it
    # suggests the flour blend used in Banana Bread and Apple Crumble.
    lemon_bars = Recipe(
        title="Lemon Bars",
        instructions=(
            "Press a shortbread crust into a pan and bake 20 minutes. Whisk eggs, "
            "sugar, lemon juice, and a little flour, pour over the crust, and bake 20 more."
        ),
        source="custom",
        gf_status="needs_adapting",
        ingredients=[
            Ingredient(name="plain flour", amount="2 cups", contains_gluten=True),
            Ingredient(name="butter", amount="1 cup, softened"),
            Ingredient(name="sugar", amount="1 1/2 cups"),
            Ingredient(name="eggs", amount="4"),
            Ingredient(name="lemon juice", amount="2/3 cup"),
        ],
    )

    # Passing ingredients=[...] above links each Ingredient to its Recipe,
    # so adding the recipes also saves their ingredients.
    db.session.add_all([shakshuka, banana_bread, teriyaki, apple_crumble, lemon_bars])
    db.session.commit()

    print(f"Seeded {Recipe.query.count()} recipes and {Ingredient.query.count()} ingredients.")