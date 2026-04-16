# קובץ זה מאתחל את אפליקציית Flask, טוען הגדרות, מגדיר CORS, מאתחל את SQLAlchemy
# ומרשם את ה-Blueprints של המודולים השונים (auth, recipes, admin, shopping_list).
# הערות אלה מסבירות את תפקיד הפונקציה create_app, שימוש ב-UPLOAD_FOLDER ויצירת טבלאות.

from flask import Flask
from flask_cors import CORS
from config import Config
from models import db
import os

# ייבוא ה-Blueprints מהתיקייה החדשה (ניצור אותם מיד)
from routes.auth import auth_bp
from routes.recipes import recipes_bp
from routes.admin import admin_bp
from routes.shopping_list import shopping_list_bp


def create_app():
    # יצירת האפליקציה וטעינת הגדרות מקובץ ה-Config
    app = Flask(__name__, static_folder='static')
    app.config.from_object(Config)

    # הגדרת CORS כדי לאפשר לאנגולר לתקשר עם השרת
    CORS(app, resources={r"/*": {"origins": "*"}}, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    # אתחול בסיס הנתונים
    db.init_app(app)

    # וידוא שתיקיית ההעלאות קיימת
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])

    # --- רישום הדפים (Blueprints) ---
    # כאן אנחנו מחברים את הקבצים הנפרדים בחזרה לאפליקציה
    app.register_blueprint(auth_bp)
    app.register_blueprint(recipes_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(shopping_list_bp)

    # יצירת הטבלאות במידה ואינן קיימות
    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == '__main__':
    # הרצת השרת במצב דיבאג
    app.run(debug=True)