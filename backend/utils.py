from functools import wraps
from flask import request, jsonify
from models import User

# קובץ זה מכיל דקורטורים לשימוש בהרשאות ובאימות בקשות.
# דקורטורים אלה קוראים את ה-User-ID מה-headers ומוודאים הרשאות (Admin, Uploader, Logged-in).
# ההערות מסבירות את מנגנון הבדיקה וההנחות (לדוגמה: User-ID נשלח בכותרת כל בקשה).

# דקורטור למנהל בלבד
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = request.headers.get('User-ID')
        user = User.query.get(user_id)
        if not user or user.role != 'Admin':
            return jsonify({"message": "גישת מנהל בלבד!"}), 403
        return f(*args, **kwargs)
    return decorated_function

# דקורטור למעלה תוכן/מנהל מאושר
def uploader_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # השורות החדשות: אם זו בקשת בדיקה של הדפדפן, אל תעצור אותה
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)

        user_id = request.headers.get('User-ID')

        # הגנה מפני מזהה ריק (מונע את האזהרה שראינו בטרמינל)
        if not user_id or user_id == 'undefined':
            return jsonify({"message": "זיהוי משתמש חסר"}), 403

        user = User.query.get(user_id)
        if not user or (user.role != 'Uploader' and user.role != 'Admin'):
            return jsonify({"message": "גישת מעלה תוכן בלבד!"}), 403

        if not user.is_approved_uploader:
            return jsonify({"message": "חשבון המעלה טרם אושר"}), 403

        return f(*args, **kwargs)

    return decorated_function

#  - בודק אם המשתמש קיים במערכת
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # אם זו בקשת בדיקה של הדפדפן - תן לה לעבור בלי בדיקת מזהה
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)

        user_id = request.headers.get('User-ID')
        if not user_id:
            return jsonify({"message": "חסר מזהה משתמש בבקשה"}), 401

        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "משתמש לא נמצא, יש להתחבר מחדש"}), 401

        return f(*args, **kwargs)

    return decorated_function