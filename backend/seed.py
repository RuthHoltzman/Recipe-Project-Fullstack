from app import app
from models import db, User, Recipe, IngredientEntry, Category # הוספנו את Category
from werkzeug.security import generate_password_hash

def seed_data():
    with app.app_context():
        # מחיקת נתונים ישנים ויצירה מחדש
        db.drop_all()
        db.create_all()

        # 1. יצירת משתמשי בדיקה
        admin = User(
            email="rut@gmail",
            password=generate_password_hash("123456", method='pbkdf2:sha256'),
            first_name="רותי",
            last_name="הולצמן",
            phone="0583221178",
            wants_updates=True,
            role="Admin",
            is_approved_uploader=True
        )

        uploader = User(
            email="chef@test.com",
            password=generate_password_hash("123456", method='pbkdf2:sha256'),
            first_name="שף",
            last_name="ישראלי",
            phone="0521234567",
            wants_updates=False,
            role="Uploader",
            is_approved_uploader=True
        )
        db.session.add_all([admin, uploader])
        db.session.commit() # שומרים כדי שיהיה להם ID

        # --- הוספת הקטגוריות קודם כדי שנוכל לקשר אליהן מתכונים ---
        seed_categories()

        # --- מתכון 1: פסטה ---
        recipe1 = Recipe(
            title="פסטה ברוטב עגבניות",
            description="מתכון קל ומהיר לארוחת צהריים",
            instructions="1. מבשלים פסטה. 2. מכינים רוטב. 3. מערבבים.",
            time_to_prepare=20,
            type="פרווה",
            rating=4.5,
            image_path="/static/images/sample_pasta.jpg",
            user_id=uploader.id,
            category="פסטות ואורז" # כדאי שיהיה תואם לאחת הקטגוריות
        )
        db.session.add(recipe1)
        db.session.flush()
        db.session.add_all([
            IngredientEntry(product_name="פסטה", amount=500, unit="גרם", recipe_id=recipe1.id),
            IngredientEntry(product_name="עגבניות", amount=4, unit="יחידות", recipe_id=recipe1.id),
            IngredientEntry(product_name="שום", amount=3, unit="שיניים", recipe_id=recipe1.id)
        ])

        # --- מתכון 2: עוגה ---

        recipe2 = Recipe(

            title="עוגת שוקולד חמה",

            description="עוגה עשירה ונימוחה",

            instructions="1. ממיסים שוקולד. "

                         "2. מוסיפים ביצים וסוכר. "

                         "3. אופים 20 דקות.",

            time_to_prepare=40,

            type="חלבי",

            rating=5.0,

            image_path="/static/images/sample_cake.jpg",

            user_id=uploader.id,

            category="קינוחים"

        )

        db.session.add(recipe2)

        db.session.flush()

        db.session.add_all([

            IngredientEntry(product_name="שוקולד מריר", amount=200, unit="גרם", recipe_id=recipe2.id),

            IngredientEntry(product_name="ביצים", amount=3, unit="יחידות", recipe_id=recipe2.id),

            IngredientEntry(product_name="סוכר", amount=1, unit="כוס", recipe_id=recipe2.id)

        ])

        # --- מתכון 3: שקשוקה (חדש) ---

        recipe3 = Recipe(

            title="שקשוקה פיקנטית",

            description="השקשוקה המסורתית עם רוטב עשיר",

            instructions="1. מטגנים בצל וגמבה. "

                         "2. מוסיפים עגבניות ושום. "

                         "3. מוסיפים ביצים ומבשלים על אש קטנה.",

            time_to_prepare=25,

            type="פרווה",

            rating=4.8,

            image_path="/static/images/shakshuka.jpg",

            user_id=uploader.id,

            category="ארוחות ערב וחלבי"

        )

        db.session.add(recipe3)

        db.session.flush()

        db.session.add_all([

            IngredientEntry(product_name="ביצים", amount=4, unit="יחידות", recipe_id=recipe3.id),

            IngredientEntry(product_name="עגבניות", amount=5, unit="יחידות", recipe_id=recipe3.id),

            IngredientEntry(product_name="בצל", amount=1, unit="יחידה", recipe_id=recipe3.id),

            IngredientEntry(product_name="גמבה", amount=1, unit="יחידה", recipe_id=recipe3.id),

            IngredientEntry(product_name="שום", amount=2, unit="שיניים", recipe_id=recipe3.id)

        ])

        # --- מתכון 4: סלט חלומי (חדש) ---

        recipe4 = Recipe(

            title="סלט חלומי",

            description="סלט מרענן עם קוביות גבינה חלומי",

            instructions="1. חותכים ירקות. "

                         "2. מטגנים קוביות חלומי. "

                         "3. מערבבים הכל עם רוטב.",

            time_to_prepare=15,

            type="חלבי",

            rating=4.7,

            image_path="/static/images/halloumi_salad.jpg",

            user_id=uploader.id

            , category="סלטים"

        )

        db.session.add(recipe4)

        db.session.flush()

        db.session.add_all([

            IngredientEntry(product_name="גבינת חלומי", amount=200, unit="גרם", recipe_id=recipe4.id),

            IngredientEntry(product_name="חסה", amount=1, unit="ראש", recipe_id=recipe4.id),

            IngredientEntry(product_name="עגבניות", amount=2, unit="יחידות", recipe_id=recipe4.id),

            IngredientEntry(product_name="מלפפון", amount=2, unit="יחידות", recipe_id=recipe4.id)

        ])

        # --- מתכון 5: חזה עוף (חדש) ---

        recipe5 = Recipe(

            title="חזה עוף במחבת",

            description="חזה עוף עסיסי בתיבול ביתי",

            instructions="1. מתבלים את העוף. "

                         "2. צולים על מחבת פסים חמה משני הצדדים.",

            time_to_prepare=15,

            type="בשרי",

            rating=4.6,

            image_path="/static/images/chicken.jpg",

            user_id=uploader.id,

            category="בשרי ועיקריות"

        )

        db.session.add(recipe5)

        db.session.flush()

        db.session.add_all([

            IngredientEntry(product_name="חזה עוף", amount=500, unit="גרם", recipe_id=recipe5.id),

            IngredientEntry(product_name="שמן זית", amount=2, unit="כפות", recipe_id=recipe5.id),

            IngredientEntry(product_name="שום", amount=1, unit="שן", recipe_id=recipe5.id)

        ])

        db.session.commit()

        print("Database seeded with more recipes successfully!")

        db.session.commit()
        print("Database seeded successfully!")

def seed_categories():
    # פונקציה זו נקראת עכשיו מתוך seed_data (או בנפרד)
    categories_data = [
        {
            'name': 'קינוחים',
            'image_url': '/static/categories/קינוחים.jpg',
            'icon': '🍩',
            'color': '#ff4081',
        },
        {
            'name': 'עוגות',
            'image_url': '/static/categories/עוגות.jpg',
            'icon': '🍰',
            'color': '#ff6347',
        },
        {
            'name': 'תוספות',
            'image_url': '/static/categories/תוספות.jpg',
            'icon': '🍅',
            'color': '#32cd32',
        },
        {
            'name': 'ארוחות צהריים',
            'image_url': '/static/categories/ארוחות צהריים.jpg',
            'icon': '🍲',
            'color': '#ff9800',
        },
        {
            'name': 'סלטים',
            'image_url': '/static/categories/סלטים.jpg',
            'icon': '🥗',
            'color': '#8bc34a',
        },
        {
            'name': 'מאפים ולחמים',
            'image_url': '/static/categories/מאפים ולחמים.jpg',
            'icon': '🥖',
            'color': '#795548',
        },
        {
            'name': 'מרקים',
            'image_url': '/static/categories/מרקים.jpg',
            'icon': '🥣',
            'color': '#00bcd4',
        },
        {
            'name': 'ארוחות ערב וחלבי',
            'image_url': '/static/categories/ארוחות ערב וחלבי.jpg',
            'icon': '🧀',
            'color': '#2196f3',
        },
        {
            'name': 'בשרי ועיקריות',
            'image_url': '/static/categories/בשרי ועיקריות.jpg',
            'icon': '🍗',
            'color': '#f44336',
        },
        {
            'name': 'דגים',
            'image_url': '/static/categories/דגים.jpg',
            'icon': '🐟',
            'color': '#009688',
        },
        {
            'name': 'פסטות ואורז',
            'image_url': '/static/categories/פסטות ואורז.jpg',
            'icon': '🍝',
            'color': '#ffc107',
        },
        {
            'name': 'מהיר וקל',
            'image_url': '/static/categories/מהיר וקל.jpg',
            'icon': '⏱️',
            'color': '#673ab7',
        },
        {
            'name': 'מתכונים לשבת',
            'image_url': '/static/categories/מתכונים לשבת.jpg',
            'icon': '🕯️',
            'color': '#3f51b5',
        },
        {
            'name': 'בריאות ודיאטה',
            'image_url': '/static/categories/בריאות ודיאטה.jpg',
            'icon': '🍎',
            'color': '#fb8c00',
        },
    ]

    for cat_data in categories_data:
        existing_category = Category.query.filter_by(name=cat_data['name']).first()
        if not existing_category:
            new_cat = Category(
                name=cat_data['name'],
                image_url=cat_data['image_url'],
                icon=cat_data['icon'],
                color=cat_data['color']
            )
            db.session.add(new_cat)
    db.session.commit()

if __name__ == "__main__":
    seed_data()