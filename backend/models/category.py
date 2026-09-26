from extensions import db

class Category(db.Model):
    __tablename__ = 'categories'

    category_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)

    characters = db.relationship('Character', back_populates='category')
    merchandise_items = db.relationship('MerchandiseItem', backref='category')

    # def to_dict(self):
    #     return {
    #         'category_id': self.category_id,
    #         'name': self.name,
    #         'description': self.description
    #     }
