from flask import Blueprint, request, jsonify, current_app
from models import db, User
from werkzeug.security import generate_password_hash, check_password_hash
import os, uuid
from utils import login_required

# דפי אימות והרשמה: מטפלים ברישום משתמשים, התחברות, עדכון פרופיל ובקשת שדרוג לחשבון Uploader.
# הערות מסבירות את הקלט/פלט של ה-API, טיפול בקבצים (profile_image) והשימוש ב-User-ID ב-headers.

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "האימייל כבר קיים במערכת"}), 400

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

    new_user = User(
        email=email,
        password=hashed_password,
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        phone=data.get('phone'),
        wants_updates=data.get('wants_updates', False),
        role='Reader'
    )
    new_user.save()
    return jsonify({"message": "המשתמש נרשם בהצלחה!"}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()

    if not user or not check_password_hash(user.password, data.get('password')):
        return jsonify({"message": "פרטי התחברות שגויים"}), 401

    return jsonify({
        "message": "התחברת בהצלחה",
        "user": {
            "id": user.id, "email": user.email, "role": user.role,
            "is_approved": user.is_approved_uploader,
            "first_name": user.first_name, "last_name": user.last_name,
            "phone": user.phone, "wants_updates": user.wants_updates,
            "profile_image": user.profile_image
        }
    }), 200


@auth_bp.route('/update-profile/<int:user_id>', methods=['PUT', 'OPTIONS'])
@login_required
def update_profile(user_id):
    if request.method == 'OPTIONS': return jsonify({"success": True}), 200
    try:
        user = User.query.get_or_404(user_id)
        user.first_name = request.form.get('first_name', user.first_name)
        user.last_name = request.form.get('last_name', user.last_name)
        user.phone = request.form.get('phone', user.phone)
        wants_updates_raw = request.form.get('wants_updates')
        if wants_updates_raw is not None:
            user.wants_updates = str(wants_updates_raw).lower() == 'true'

        if 'profile_image' in request.files:
            file = request.files['profile_image']
            if file and file.filename != '':
                ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'png'
                filename = f"profile_{user.id}_{uuid.uuid4().hex}.{ext}"
                file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                user.profile_image = f"/static/images/{filename}"

        db.session.commit()
        return jsonify({"message": "Success", "user": {
            "id": user.id, "first_name": user.first_name, "last_name": user.last_name,
            "email": user.email, "profile_image": user.profile_image,
            "phone": user.phone, "wants_updates": user.wants_updates,
            "role": user.role, "is_approved": user.is_approved_uploader
        }}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Server error: {str(e)}"}), 500


@auth_bp.route('/request-upgrade', methods=['POST'])
@login_required
def request_upgrade():
    user_id = request.json.get('user_id')
    user = User.query.get_or_404(user_id)
    user.role = 'Uploader'
    user.is_approved_uploader = False
    user.save()
    return jsonify({"message": "הבקשה נשלחה למנהל המערכת"}), 200