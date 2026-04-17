import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

// שרות מתכונים - טיפול בכל הבקשות HTTP הקשורות למתכונים
@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private apiUrl = environment.apiUrl ; // כתובת השרת

  constructor(private http: HttpClient) {}

  // --- פונקציות עזר ---

  // קבל את ה-Headers עם User-ID מהזיכרון (משתמש פעיל)
  private getAuthHeaders(): HttpHeaders {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = userData.id ? userData.id.toString() : '';
    return new HttpHeaders().set('User-ID', userId);
  }

  // --- חיפוש ופילטור ---

  // חיפוש מתכונים לפי רשימת מוצרים (חיפוש המקרר החכם)
  findBestMatch(ingredients: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/search-by-ingredients`, {
      ingredients,
    });
  }

  // חיפוש מתכונים לפי רשימת מוצרים (גרסה חלופית)
  searchRecipes(ingredients: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/search-by-ingredients`, {
      ingredients,
    });
  }

  // קבל רשימה של קטגוריות מתכונים
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories`);
  }

  // קבל פרטי מתכון ספציפי לפי ID
  getRecipeById(id: string): Observable<any> {
    // 1. קבל מידע משתמש מהזיכרון
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = userData.id ? userData.id.toString() : '';

    // 2. קבל Headers עם User-ID
    const headers = new HttpHeaders().set('User-ID', userId);

    // 3. שלח בקשה לשרת עם User-ID כדי להביא מידע מותאם (דירוג, מועדפים וכו')
    return this.http.get(`${this.apiUrl}/recipes/${id}`, { headers });
  }
 getUserFavorites(): Observable<any[]> {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userData.id ? userData.id.toString() : '';
  const headers = new HttpHeaders().set('User-ID', userId);

  // וודאי שהנתיב הזה תואם ל-Python (כולל ה-api/)
  return this.http.get<any[]>(`${this.apiUrl}/recipes/my-favorites`, { headers });
}
  // שליפת כל רשימת הקניות של המשתמש
  getShoppingList(): Observable<any[]> {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = userData.id ? userData.id.toString() : '';
    const headers = new HttpHeaders().set('User-ID', userId);

    // שימי לב שהנתיב תואם למה שכתבנו ב-Python
    return this.http.get<any[]>(`${this.apiUrl}/shopping-list`, { headers });
  }
  deleteShoppingItem(itemId: number): Observable<any> {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = userData.id ? userData.id.toString() : '';
    const headers = new HttpHeaders().set('User-ID', userId);

    return this.http.delete(`${this.apiUrl}/shopping-list/${itemId}`, {
      headers,
    });
  }
  // הוספת מתכון שלם לרשימת הקניות בשרת
  addRecipeToShoppingList(recipeId: number): Observable<any> {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = userData.id ? userData.id.toString() : '';
    const headers = new HttpHeaders().set('User-ID', userId);

    return this.http.post(
      `${this.apiUrl}/shopping-list/add-recipe/${recipeId}`,
      {},
      { headers }
    );
  }
  addRecipe(
    recipeData: any,
    ingredients: any[],
    imageFile: File,
    userId: number
  ): Observable<any> {
    const formData = new FormData();

    // הוספת השדות הבסיסיים
    formData.append('title', recipeData.title || '');
    formData.append('description', recipeData.description || '');
    formData.append('instructions', recipeData.instructions || '');
    formData.append('type', recipeData.type || '');
    formData.append('category', recipeData.category || '');
    formData.append('user_id', userId.toString());

    // --- תיקון: הוספת השדות שחסרו ---
    formData.append('difficulty', recipeData.difficulty || 'קל');
    formData.append('servings', (recipeData.servings || 1).toString());

    // זמן הכנה
    const time = recipeData.time_to_prepare
      ? recipeData.time_to_prepare.toString()
      : '30';
    formData.append('time_to_prepare', time);

    // תמונה ומצרכים
    formData.append('image', imageFile);
    formData.append('ingredients', JSON.stringify(ingredients));

    // שליחה עם ה-Headers הנדרשים
    const headers = new HttpHeaders().set('User-ID', userId.toString());
    return this.http.post(`${this.apiUrl}/recipes`, formData, { headers });
  }

  searchByIngredients(ingredients: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/search-by-ingredients`, {
      ingredients,
    });
  }

  getAllRecipes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all_recipes`);
  }
  addReview(
    recipeId: number,
    rating: number,
    userId: number,
    comment: string = ''
  ): Observable<any> {
    const headers = new HttpHeaders().set('User-ID', userId.toString());
    return this.http.post(
      `${this.apiUrl}/recipes/${recipeId}/review`,
      { rating, comment },
      { headers }
    );
  }

  toggleFavorite(recipeId: number, userId: number): Observable<any> {
    const headers = new HttpHeaders().set('User-ID', userId.toString());
    return this.http.post(
      `${this.apiUrl}/recipes/${recipeId}/toggle-favorite`,
      {},
      { headers }
    );
  }

  // --- הוספת Headers לפונקציות האדמין (חובה למניעת 403) ---

  deleteRecipeByAdmin(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/recipes/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAdminRecipes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/recipes`, {
      headers: this.getAuthHeaders(),
    });
  }

  getPendingUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/pending-users`, {
      headers: this.getAuthHeaders(),
    });
  }

  approveUser(userId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/admin/approve-user/${userId}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }
}
