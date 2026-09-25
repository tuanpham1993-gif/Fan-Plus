#Application entry point.
from flask import Flask
from extensions import db
from routes.category_routes import category_bp
from routes.character_routes import character_bp
from routes.merchandise_routes import merchandise_bp
from routes.admin_category_routes import admin_category_bp
from routes.admin_character_routes import admin_character_bp
from routes.admin_merchandise_routes import admin_merchandise_bp

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = (
    "mysql+pymysql://root:@localhost:3306/fanhub"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

#đăng ký các blueprint cho các route(blueprint là một cách để tổ chức các route trong Flask)
app.register_blueprint(category_bp)
app.register_blueprint(character_bp)
app.register_blueprint(merchandise_bp)
app.register_blueprint(admin_category_bp)
app.register_blueprint(admin_character_bp)
app.register_blueprint(admin_merchandise_bp)

# Seed initial data là một hàm được sử dụng để thêm dữ liệu mẫu vào cơ sở dữ liệu khi ứng dụng được khởi chạy lần đầu tiên. Nó kiểm tra xem có bất kỳ bản ghi nào trong bảng Category hay không. Nếu không có, nó sẽ tạo ra các danh mục, nhân vật và mặt hàng merchandise mẫu để người dùng có thể thử nghiệm và kiểm tra ứng dụng mà không cần phải nhập dữ liệu thủ công.
def seed_initial_data():
    from models.category import Category
    from models.character_profile import CharacterProfile
    from models.merchandise_item import MerchandiseItem

    if Category.query.first():
        return

    category_names = [
        "Anime", "Gaming", "Movies", "TV Shows",
        "K-Pop", "Comics", "Manga", "Cosplay"
    ]
    for name in category_names:
        cat = Category(name=name, description=f"Category for {name}")
        db.session.add(cat)
    db.session.commit()

    all_cats = Category.query.all()
    categories_dict = {c.name: c.category_id for c in all_cats}

    characters_data = [
        ("Naruto Uzumaki", "Anime", "Ninja from Leaf Village", "http://example.com/naruto.jpg"),
        ("Sailor Moon", "Anime", "Soldier of Love and Justice", "http://example.com/sailormoon.jpg"),
        ("Mario", "Gaming", "Hero of Mushroom Kingdom", "http://example.com/mario.jpg"),
        ("Spider-Man", "Movies", "Your friendly neighborhood Spider-Man", "http://example.com/spiderman.jpg"),
        ("Eleven", "TV Shows", "Girl with telepathic powers", "http://example.com/eleven.jpg"),
        ("Jungkook", "K-Pop", "Member of BTS", "http://example.com/jungkook.jpg"),
        ("Batman", "Comics", "The Dark Knight", "http://example.com/batman.jpg"),
        ("Monkey D. Luffy", "Manga", "Captain of Straw Hat Pirates", "http://example.com/luffy.jpg"),
        ("Link", "Cosplay", "Hero of Time", "http://example.com/link.jpg"),
        ("Kirby", "Gaming", "Pink hero from Planet Popstar", "http://example.com/kirby.jpg")
    ]
    for name, cat_name, bio, img in characters_data:
        char = CharacterProfile(
            name=name,
            category_id=categories_dict[cat_name],
            bio=bio,
            image_url=img
        )
        db.session.add(char)
    db.session.commit()

    all_chars = CharacterProfile.query.all()
    characters_dict = {ch.name: ch.character_id for ch in all_chars}

    merchandise_data = [
        ("Naruto Figure", "Anime", "Naruto Uzumaki", "http://example.com/naruto_fig.jpg", "Collectible", False),
        ("Anime Mystery Box", "Anime", None, "http://example.com/anime_box.jpg", "Limited Edition", True),
        ("Mario Figure", "Gaming", "Mario", "http://example.com/mario_fig.jpg", "Collectible", False),
        ("Spider-Man Poster", "Movies", "Spider-Man", "http://example.com/spiderman_poster.jpg", "Collectible", False),
        ("TV Shows Collector Box", "TV Shows", None, "http://example.com/tv_box.jpg", "Pre-Order", True),
        ("K-Pop Photo Card Set", "K-Pop", "Jungkook", "http://example.com/kpop_cards.jpg", "Limited Edition", True),
        ("Batman T-Shirt", "Comics", "Batman", "http://example.com/batman_tshirt.jpg", "Collectible", False),
        ("Luffy Figure", "Manga", "Monkey D. Luffy", "http://example.com/luffy_fig.jpg", "Pre-Order", True),
        ("Link Cosplay Set", "Cosplay", "Link", "http://example.com/link_cosplay.jpg", "Collectible", False),
        ("Kirby Plush", "Gaming", "Kirby", "http://example.com/kirby_plush.jpg", "Limited Edition", False)
    ]

    for name, cat_name, char_name, img, tag, is_upcoming in merchandise_data:
        char_id = characters_dict[char_name] if char_name else None
        item = MerchandiseItem(
            name=name,
            category_id=categories_dict[cat_name],
            character_id=char_id,
            image_url=img,
            tag=tag,
            is_upcoming=is_upcoming,
            view_count=0
        )
        db.session.add(item)
    db.session.commit()

with app.app_context():
    db.create_all()
    seed_initial_data()

@app.get("/")
def home():
    return {"message": "Fan Hub API is running"}


if __name__ == "__main__":
    app.run(debug=True)
