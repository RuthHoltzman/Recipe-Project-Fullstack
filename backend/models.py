from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# מודל הנתונים של האפליקציה - הגדרות SQLAlchemy ומחלקות שנשמרות במסד הנתונים.
# הקובץ מגדיר מבנה בסיס (BaseModel) עם שדות משותפים, טבלאות many-to-many (favorites)
# ודגמי יישום: User, Recipe, IngredientEntry, Review, Category, ShoppingItem.
# שים לב: יש שימוש ב-cascade על רשומות של רכיבים כדי שכשמתכון נמחק - רכיביו ימחקו גם כן.

# מחלקת בסיס לכל הטבלאות
class BaseModel(db.Model):
    __abstract__ = True
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def save(self):
        db.session.add(self)
        db.session.commit()

# טבלת קישור למועדפים (Many-to-Many)
favorites = db.Table('favorites',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('recipe_id', db.Integer, db.ForeignKey('recipes.id'), primary_key=True)
)

class User(BaseModel):
    __tablename__ = 'users'
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default='Reader')
    is_approved_uploader = db.Column(db.Boolean, default=False)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    wants_updates = db.Column(db.Boolean, default=False)
    profile_image = db.Column(db.Text, nullable=True)

    # קשרים
    recipes = db.relationship('Recipe', backref='author', lazy=True)
    reviews = db.relationship('Review', backref='user', lazy=True)
    favorite_recipes = db.relationship('Recipe', secondary=favorites, backref=db.backref('favorited_by', lazy='dynamic'))

class Recipe(BaseModel):
    __tablename__ = 'recipes'
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    instructions = db.Column(db.Text)
    time_to_prepare = db.Column(db.Integer)
    difficulty = db.Column(db.String(20))
    servings = db.Column(db.Integer, default=1)
    type = db.Column(db.String(20))
    rating = db.Column(db.Float, default=0.0)
    image_path = db.Column(db.String(255))
    category = db.Column(db.String(50), nullable=False, default='כללי')
    variation_paths = db.Column(db.JSON)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # קשרים עם מחיקה אוטומטית (Cascade)
    ingredients = db.relationship('IngredientEntry', backref='recipe', lazy=True, cascade="all, delete-orphan")
    recipe_reviews = db.relationship('Review', backref='recipe', lazy=True, cascade="all, delete-orphan")

class IngredientEntry(BaseModel):
    __tablename__ = 'ingredients'
    product_name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20))
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), nullable=False)

class Review(BaseModel):
    __tablename__ = 'reviews'
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), nullable=False)

class Category(BaseModel):
    __tablename__ = 'categories'
    name = db.Column(db.String(50), unique=True, nullable=False)
    image_url = db.Column(db.String(255))
    icon = db.Column(db.String(10))
    color = db.Column(db.String(10))

class ShoppingItem(BaseModel):
        product_name = db.Column(db.String(100), nullable=False)
        amount = db.Column(db.String(50))
        unit = db.Column(db.String(50))
        is_completed = db.Column(db.Boolean, default=False)
        user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

        # קשר למשתמש (אופציונלי, עוזר בשליפה)
        user = db.relationship('User', backref=db.backref('shopping_items', lazy=True))