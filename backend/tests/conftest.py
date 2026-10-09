"""
conftest.py — Shared setup for the tests that use Flask and the database.

pytest loads this file automatically before running any tests.
The fixtures below give each test a fresh, empty database
and a test client for sending requests to the API.
"""

import os

# Point the app at a temporary SQLite database that lives only in memory.
# This must happen BEFORE config.py is imported, because config.py reads
# DATABASE_URL as soon as it loads. load_dotenv() never overwrites a value
# that is already set, so your real database in .env is never touched.
os.environ["DATABASE_URL"] = "sqlite://"

import pytest

from app import app as flask_app  # importing app.py also registers all the routes
from config import db


@pytest.fixture
def app():
    """A fresh, empty database for each test."""
    # Safety check: stop right away if the tests aren't using the in-memory database.
    assert flask_app.config["SQLALCHEMY_DATABASE_URI"] == "sqlite://"
    flask_app.config["TESTING"] = True

    with flask_app.app_context():
        db.create_all()     # build the tables from models.py
        yield flask_app     # the test runs here
        db.session.remove()
        db.drop_all()       # throw everything away afterwards


@pytest.fixture
def client(app):
    """Sends fake requests to the API, like Postman, without running the server."""
    return app.test_client()