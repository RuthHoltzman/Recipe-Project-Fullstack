# קובץ הגדרות מרכזי של האפליקציה.
# כאן מוגדרים נתיבי מסד הנתונים, תיקיית ההעלאות, ומגבלות גודל קבצים.
# חשוב: יש להחליף את ה-SECRET_KEY לערך בטוח בסביבת פרודקשן (סביבת רצה/משתני סביבה).
# הערה נוספת: SQLALCHEMY_DATABASE_URI מוגדר ל-sqlite מקומי בקובץ database.db (קל לניסוי ופיתוח).

import os


class Config:
    # הגדרת נתיב הבסיס של הפרויקט
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))

    # הגדרות מסד נתונים
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(BASE_DIR, 'database.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # הגדרות תיקיות קבצים (הפרדנו בין העלאות לקטגוריות)
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'images')
    CATEGORIES_FOLDER = os.path.join(BASE_DIR, 'static', 'categories')

    # הגבלה על גודל קובץ (16MB)
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024


