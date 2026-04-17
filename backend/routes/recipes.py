from flask import Blueprint, request, jsonify, current_app
from models import db, Recipe, IngredientEntry, Category, Review, User
from utils import uploader_required, login_required
from sqlalchemy import func
import os, json, uuid
from PIL import Image, ImageEnhance, ImageFilter

# דפי מתכונים: קריאה ל-API לצפייה, יצירה, חיפוש לפי מרכיבים, ביקורות, וסימוני מועדפים.
# הערות מסבירות: איך יוצרים מתכון (form + קובץ image), עיבוד תמונה בעזרת Pillow, שמירת variation_paths,
# ומה ההנחות לגבי User-ID בע-Headers בשאילתות שמצריכות אימות.

# הגדרת ה-Blueprint
recipes_bp = Blueprint('recipes', __name__)

# --- 1. קבלת מתכון בודד (כולל לוגיקת מועדפים ודירוג ) ---
@recipes_bp.route('/recipes/<int:recipe_id>', methods=['GET'])
def get_recipe(recipe_id):
    user_id = request.headers.get('User-ID')
    recipe = Recipe.query.get_or_404(recipe_id)
    is_favorite = False
    user_rating = 0

    # לוגיקה לבדיקת מועדפים ודירוג אישי של המשתמש הצופה
    if user_id and user_id != 'undefined':
        user = User.query.get(user_id)
        if user:
            is_favorite = recipe in user.favorite_recipes
            existing_review = Review.query.filter_by(user_id=user_id, recipe_id=recipe_id).first()
            if existing_review:
                user_rating = existing_review.rating

    return jsonify({
        "id": recipe.id,
        "title": recipe.title,
        "description": recipe.description,
        "instructions": recipe.instructions,
        "time_to_prepare": recipe.time_to_prepare,
        "difficulty": recipe.difficulty,
        "servings": recipe.servings,
        "type": recipe.type,
        "category": recipe.category,
        "rating": recipe.rating,
        "image_path": recipe.image_path,
        "variation_paths": recipe.variation_paths or [],
        "is_favorite": is_favorite,
        "user_rating": user_rating,
        "ingredients": [
            {"product_name": i.product_name, "amount": i.amount, "unit": i.unit}
            for i in recipe.ingredients
        ]
    })

# --- 2. יצירת מתכון (מיזוג לוגיקת Pillow והשדות משני הדפים) ---
@recipes_bp.route('/recipes', methods=['POST'])
@uploader_required
def create_recipe():
    try:
        data = request.form
        file = request.files.get('image')

        if not file:
            return jsonify({"message": "חובה להעלות תמונה"}), 400

        # --- 1. שמירת התמונה המקורית ---
        unique_id = str(uuid.uuid4())
        original_filename = f"{unique_id}_original.jpg"
        original_path = os.path.join(current_app.config['UPLOAD_FOLDER'], original_filename)
        file.save(original_path)

        # --- 2. לוגיקת Pillow: יצירת וריאציות ---
        variation_urls = []
        img = Image.open(original_path).convert("RGB")

        # רשימת אפקטים ליצירה
        effects = [
            ("detail", ImageFilter.DETAIL),
            ("contour", ImageFilter.CONTOUR),
            ("edge", ImageFilter.EDGE_ENHANCE)
        ]

        for suffix, effect in effects:
            variant_img = img.filter(effect)
            v_filename = f"{unique_id}_{suffix}.jpg"
            v_path = os.path.join(current_app.config['UPLOAD_FOLDER'], v_filename)
            variant_img.save(v_path)
            variation_urls.append(f"/static/images/{v_filename}")

        # --- 3. יצירת אובייקט המתכון עם כל השדות ---
        new_recipe = Recipe(
            title=data.get('title'),
            description=data.get('description', ''),
            instructions=data.get('instructions'),
            type=data.get('type', 'פרווה'),
            category=data.get('category', 'כללי'),
            difficulty=data.get('difficulty', 'קל'), # שדה שקיים ב-DB
            user_id=data.get('user_id'),
            time_to_prepare=int(data.get('time_to_prepare') or 30),
            servings=int(data.get('servings') or 1), # שדה שקיים ב-DB
            image_path=f"/static/images/{original_filename}",
            variation_paths=variation_urls  # שמירת רשימת הנתיבים שיצרנו
        )

        db.session.add(new_recipe)
        db.session.flush()

        # --- 4. שמירת המצרכים ---
        ingredients_raw = data.get('ingredients')
        if ingredients_raw:
            ingredients_list = json.loads(ingredients_raw)
            for ing in ingredients_list:
                db.session.add(IngredientEntry(
                    product_name=ing.get('product_name'),
                    amount=ing.get('amount', 1),
                    unit=ing.get('unit', 'יחידה'),
                    recipe_id=new_recipe.id
                ))

        db.session.commit()
        return jsonify({"message": "המתכון והווריאציות נשמרו בהצלחה", "id": new_recipe.id}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Server Error Detail: {str(e)}")
        return jsonify({"message": f"שגיאה פנימית: {str(e)}"}), 500


# --- 3. חיפוש לפי מצרכים (המקרר) ---
@recipes_bp.route('/search-by-ingredients', methods=['POST'])
def search_by_ingredients():
    data = request.get_json()
    user_ingredients_list = data.get('ingredients', [])
    user_set = set(ing.strip() for ing in user_ingredients_list if ing.strip())

    matching_recipes = []
    all_recipes = Recipe.query.all()

    for recipe in all_recipes:
        recipe_ingredients = [ing.product_name for ing in recipe.ingredients]
        recipe_set = set(recipe_ingredients)
        if not recipe_set: continue

        common = user_set.intersection(recipe_set)
        missing = list(recipe_set - user_set)
        score = (len(common) / len(recipe_set)) * 100

        if score >= 20:
            matching_recipes.append({
                "id": recipe.id,
                "title": recipe.title,
                "image_name": recipe.image_path,
                "match_percentage": round(score, 1),
                "missing_ingredients": missing
            })

    matching_recipes.sort(key=lambda x: x['match_percentage'], reverse=True)
    return jsonify(matching_recipes), 200

# --- 4. פונקציות ניהול (מועדפים, דירוג וקטגוריות) ---

@recipes_bp.route('/all_recipes', methods=['GET'])
def get_all_recipes():
    recipes = Recipe.query.all()
    return jsonify([{
        'id': r.id, 'title': r.title, 'description': r.description,
        'image_path': r.image_path, 'rating': r.rating,
        'category': r.category, 'type': r.type,
        'favorites_count': r.favorited_by.count() if hasattr(r, 'favorited_by') else 0,
        'time_to_prepare': r.time_to_prepare, 'difficulty': r.difficulty
    } for r in recipes])


@recipes_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([{
        "id": c.id, "name": c.name, "image_url": c.image_url,
        "icon": c.icon, "color": getattr(c, 'color', '#ffffff')
    } for c in categories])

@recipes_bp.route('/recipes/<int:recipe_id>/review', methods=['POST'])
@login_required
def add_review(recipe_id):
    user_id = request.headers.get('User-ID')
    data = request.get_json()
    rating_value = data.get('rating')

    if not rating_value or not (1 <= rating_value <= 5):
        return jsonify({"message": "דירוג לא תקין"}), 400

    # בדיקה אם המשתמש כבר דירג - אם כן, נעדכן. אם לא, ניצור.
    review = Review.query.filter_by(user_id=user_id, recipe_id=recipe_id).first()
    if review:
        review.rating = rating_value
    else:
        review = Review(user_id=user_id, recipe_id=recipe_id, rating=rating_value)
        db.session.add(review)

    db.session.commit()

    # חישוב ממוצע חדש למתכון
    avg_rating = db.session.query(func.avg(Review.rating)).filter(Review.recipe_id == recipe_id).scalar()
    recipe = Recipe.query.get(recipe_id)
    recipe.rating = float(avg_rating or 0)
    db.session.commit()

    return jsonify({"new_avg": recipe.rating, "user_rating": rating_value}), 200


# --- 5. שליפת כל המועדפים של המשתמש (עבור דף My Book) ---
@recipes_bp.route('/recipes/my-favorites', methods=['GET'])
@login_required
def get_user_favorites_list():
    user_id = request.headers.get('User-ID')
    user = User.query.get(user_id)

    if not user:
        return jsonify({"message": "משתמש לא נמצא"}), 404

    # מחזירים את רשימת המתכונים שהמשתמש סימן ב-Favorite
    return jsonify([{
        'id': r.id,
        'title': r.title,
        'description': r.description,
        'image_path': r.image_path,
        'rating': r.rating,
        'category': r.category,
        'type': r.type,
        'time_to_prepare': r.time_to_prepare,
        'difficulty': r.difficulty
    } for r in user.favorite_recipes])

# --- 6. הסרה/הוספה של מועדף (Toggle) ---
@recipes_bp.route('/recipes/<int:recipe_id>/toggle-favorite', methods=['POST'])
@login_required
def toggle_favorite(recipe_id):
    user_id = request.headers.get('User-ID')
    user = User.query.get(user_id)
    recipe = Recipe.query.get_or_404(recipe_id)

    if recipe in user.favorite_recipes:
        user.favorite_recipes.remove(recipe)
        is_fav = False
    else:
        user.favorite_recipes.append(recipe)
        is_fav = True

    db.session.commit()
    # מחזירים את המצב החדש כדי שהאנגולר ידע אם לצבוע את הלב או להסיר מהרשימה
    return jsonify({"is_favorite": is_fav})


@recipes_bp.route('/user/<int:user_id>/recipes', methods=['GET'])
def get_user_recipes(user_id):
    try:
        # שליפת המתכונים של המשתמש
        recipes = Recipe.query.filter_by(user_id=user_id).all()

        output = []
        for r in recipes:
            # בדיקה כמה אנשים סימנו את המתכון במועדפים
            # אם זה AppenderQuery, משתמשים ב-.count()
            fav_count = 0
            if hasattr(r, 'favorited_by'):
                try:
                    fav_count = r.favorited_by.count()  # לשימוש עם lazy='dynamic'
                except:
                    fav_count = len(r.favorited_by)  # לשימוש עם רשימה רגילה

            output.append({
                'id': r.id,
                'title': r.title,
                'description': r.description,
                'image_path': r.image_path,
                'rating': r.rating,
                'category': r.category,
                'type': r.type,
                'time_to_prepare': r.time_to_prepare,
                'difficulty': r.difficulty,
                'favorites_count': fav_count
            })

        return jsonify(output), 200
    except Exception as e:
        # הדפסת השגיאה המדויקת בטרמינל כדי שנוכל לראות אותה
        print(f"Error fetching user recipes: {str(e)}")
        return jsonify({"message": f"Server Error: {str(e)}"}), 500