from flask import Blueprint, jsonify, request
from models import db, User, Recipe
from utils import admin_required

admin_bp = Blueprint('admin', __name__)

# דפי ניהול: שמירת משתמשים, אישור יורדרים, ושליפת/מחיקה של מתכונים על ידי מנהל.
# הערות מסבירות את הלמה של @admin_required והנתונים שמוחזרים ללקוח.

# קבלת כל המשתמשים + הממתינים
@admin_bp.route('/admin/users', methods=['GET'])
@admin_required
def get_all_users():
    all_users = User.query.all()
    pending = User.query.filter_by(role='Uploader', is_approved_uploader=False).all()
    return jsonify({
        "all_users": [{"id": u.id, "email": u.email,"is_approved_uploader":u.is_approved_uploader, "role": u.role,"profile_image":u.profile_image,"wants_updates":u.wants_updates,"last_name":u.last_name,"first_name":u.first_name} for u in all_users],
        "pending_requests": [{"id": u.id, "email": u.email} for u in pending]
    }), 200



# קבלת כל המתכונים למנהל
@admin_bp.route('/admin/recipes', methods=['GET'])
@admin_required
def admin_get_all_recipes():
    try:
        recipes = Recipe.query.all()
        output = []
        for r in recipes:
            user = User.query.get(r.user_id)
            output.append({
                "id": r.id, "title": r.title, "type": r.type,
                "author": user.email if user else "לא ידוע",
                "category": r.category
            })
        return jsonify(output)
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# אישור משתמש
@admin_bp.route('/admin/approve-user/<int:user_id>', methods=['POST'])
@admin_required
def approve_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_approved_uploader = True
    user.save()
    return jsonify({"message": f"המשתמש {user.email} אושר בהצלחה!"}), 200

# מחיקת מתכון ע"י מנהל
@admin_bp.route('/admin/recipes/<int:recipe_id>', methods=['DELETE'])
@admin_required
def admin_delete_recipe(recipe_id):
    recipe = Recipe.query.get_or_404(recipe_id)
    db.session.delete(recipe)
    db.session.commit()
    return jsonify({"message": "המתכון נמחק בהצלחה על ידי המנהל"})