from extensions import db
from models.merchandise import Merchandise

def get_all_merchandise():
    return Merchandise.query.order_by(Merchandise.id.desc()).all()

def create_merchandise(name, price, description='', image='', category='Figures', stock=50, rating=4.8):
    item = Merchandise(
        name=name,
        description=description,
        price=float(price),
        image=image,
        category=category,
        stock=int(stock),
        rating=float(rating)
    )
    db.session.add(item)
    db.session.commit()
    return item
