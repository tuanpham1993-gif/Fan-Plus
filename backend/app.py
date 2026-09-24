#Application entry point.
from flask import Flask
from extensions import db
from routes.usertest import user_bp

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = (
    "mysql+pymysql://root:@localhost:3306/fanhub"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)
app.register_blueprint(user_bp)

with app.app_context():
    db.create_all()

@app.get("/")
def home():
    return {"message": "Fan Hub API is running"}


if __name__ == "__main__":
    app.run(debug=True)