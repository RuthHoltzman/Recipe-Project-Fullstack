import { Component, OnInit } from '@angular/core'; // Component והLifecycle hook OnInit
import { Router, RouterLink } from '@angular/router'; // ניווט בין דפים
import { RecipeService } from '../../services/recipe.service'; // שרות למשיכת קטגוריות ומתכונים
import { environment } from '../../environments/environment';

/**
 * HomeComponent - עמוד הבית של האפליקציה
 * 
 * אחראי על:
 * - הצגת כל הקטגוריות (בשרי, חלבי, פרוודה וכו')
 * - שדה חיפוש חופשי
 * - ניווט למתכונים לפי קטגוריה
 */
@Component({
  selector: 'app-home', // טג הקומפוננטה
  templateUrl: './home.component.html', // ה-HTML של הדף
  styleUrls: ['./home.component.css'], // ה-CSS של הדף
  standalone: true, // קומפוננטה עומדת בעצמה
  imports: [RouterLink] // ייבוא הRouterLink לניווט
})
export class HomeComponent implements OnInit {
  // מערך הקטגוריות שיטעינו מהשרת
  categories: any[] = [];

  apiUrl: string = environment.apiUrl;
  
  constructor(
    private router: Router, // ניווט בין דפים
    private recipeService: RecipeService // שרות המתכונים
  ) {}

  /**
   * ngOnInit: Lifecycle hook שרץ ברגע כש-הקומפוננטה טוענת
   * משימה עיקרית: טעינת נתונים מהשרת
   */
  ngOnInit(): void {
    // קריאה לשרת כדי לקבל את רשימת הקטגוריות
    this.recipeService.getCategories().subscribe({
      next: (data: any[]) => {
        // אם ההצלחה - שמור את הקטגוריות במשתנה
        this.categories = data;
      },
      error: (error: any) => {
        // אם שגיאה - הדפס אותה לconsole
        console.error('שגיאה בטעינת קטגוריות:', error);
      }
    });
  }

  /**
   * navigateToCategory: ניווט לעמוד כלהמתכונים עם סינון לפי קטגוריה
   * @param catName - שם הקטגוריה שנבחרה
   */
  navigateToCategory(catName: string) {
    // navigate = עבור לURL הזה
    // queryParams = הוסף פרמטרים לURL (?category=בשרי וכו')
    this.router.navigate(['/recipes'], { queryParams: { category: catName } });
  }

  /**
   * searchRecipes: חיפוש חופשי בשם המתכון
   * @param event - האירוע מהinput (החיפוש שהוקלד)
   */
  searchRecipes(event: any) {
    const term = event.target.value; // קבל את הטקסט שהוקלד
    
    // רק אם הטקסט הוא 3 אותיות ויותר, ננווט
    if (term && term.length > 2) {
      this.router.navigate(['/recipes'], { queryParams: { search: term } });
    }
  }
}