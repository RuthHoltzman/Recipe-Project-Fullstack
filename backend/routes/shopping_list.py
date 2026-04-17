from flask import Blueprint, request, jsonify, current_app
from models import db, Recipe, IngredientEntry, Category, Review, User,ShoppingItem
from utils import  login_required
from sqlalchemy import func
import os, json, uuid
from PIL import Image, ImageEnhance, ImageFilter

# הגדרת ה-Blueprint ללא url_prefix כי הכתובות כוללות api/
shopping_list_bp = Blueprint('shopping_list', __name__)

# דפי רשימת קניות: טיפול בפריטים של כל משתמש (הוספה ממתכון, שליפה, מחיקה).
# הערות מסבירות שה-User-ID מועבר בכותרות הבקשה וכי הפריטים מקושרים למשתמש.

@shopping_list_bp.route('/shopping-list/<int:item_id>', methods=['DELETE'])
@login_required
def delete_shopping_item(item_id):
    user_id = request.headers.get('User-ID')
    item = ShoppingItem.query.filter_by(id=item_id, user_id=user_id).first_or_404()

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "הפריט נמחק בהצלחה"})

# 2. שליפת רשימת הקניות של המשתמש המחובר
@shopping_list_bp.route('/shopping-list', methods=['GET'])
@login_required
def get_shopping_list():
    user_id = request.headers.get('User-ID')
    items = ShoppingItem.query.filter_by(user_id=user_id).all()

    return jsonify([{
        "id": i.id,
        "product_name": i.product_name,
        "amount": i.amount,
        "unit": i.unit,
        "is_completed": i.is_completed
    } for i in items])


# 1. הוספת כל המצרכים של מתכון מסוים לרשימת הקניות
@shopping_list_bp.route('/shopping-list/add-recipe/<int:recipe_id>', methods=['POST'])
@login_required
def add_recipe_to_shopping_list(recipe_id):
    user_id = request.headers.get('User-ID')
    recipe = Recipe.query.get_or_404(recipe_id)

    try:
        for ing in recipe.ingredients:
            new_item = ShoppingItem(
                product_name=ing.product_name,
                amount=ing.amount,
                unit=ing.unit,
                user_id=user_id
            )
            db.session.add(new_item)

        db.session.commit()
        return jsonify({"message": f"המצרכים של {recipe.title} נוספו בהצלחה!"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
