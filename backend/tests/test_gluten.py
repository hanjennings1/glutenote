"""
test_gluten.py — Tests for the gluten keyword check in gluten.py.

These are unit tests: they call may_contain_gluten() directly,
with no database, no Flask, and no internet needed.
"""

import pytest

from gluten import may_contain_gluten


# @pytest.mark.parametrize runs the same test once for each value in the list,
# so one short test checks many ingredients. Each one shows up separately in the results.
@pytest.mark.parametrize("name", [
    "Plain Flour",          # basic keyword, any capitalization
    "spaghetti",
    "Soy Sauce",            # two-word keyword
    "Pale Ale",
    "crackers",             # plural of "cracker"
    "Whole wheat bread",
])
def test_flags_gluten_ingredients(name):
    assert may_contain_gluten(name) is True


@pytest.mark.parametrize("name", [
    "Rice Flour",           # gluten-free exceptions are checked first
    "gluten-free pasta",
    "Buckwheat",            # contains "wheat", but buckwheat is gluten-free
    "Tamari",
    "Kale",                 # contains "ale", but only whole words count
    "Chicken Breast",
    "Olive Oil",
])
def test_does_not_flag_gluten_free_ingredients(name):
    assert may_contain_gluten(name) is False


@pytest.mark.parametrize("name", ["", None])
def test_empty_name_is_not_flagged(name):
    assert may_contain_gluten(name) is False