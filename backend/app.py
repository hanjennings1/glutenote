from config import app, db
from models import Recipe, Ingredient

@app.route("/")
def index():
    return {"message": "Glutenote API is running"}

if __name__ == "__main__":
    app.run(port=5555, debug=True)