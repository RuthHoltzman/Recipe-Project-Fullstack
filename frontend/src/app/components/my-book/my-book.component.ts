import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // חובה עבור standalone components
import { RouterModule, Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../environments/environment';

// דף ספר המתכונים שלי - מתכונים שסימנתי כמועדפים
@Component({
  selector: 'app-my-book',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-book.component.html',
  styleUrls: ['./my-book.component.css']
})
export class MyBookComponent implements OnInit {
  favoriteRecipes: any[] = []; // רשימת המתכונים המועדפים שלי
  isLoading = true; // האם עדיין טוענים?
  shoppingListCount = 0; // כמה מוצרים ברשימת הקניות?
apiUrl: string = environment.apiUrl;
  constructor(private recipeService: RecipeService,
     private router: Router,
     private notify: NotificationService)
     {}

  // טוען את המתכונים המועדפים כשהדף עולה
  ngOnInit(): void {
    this.loadFavorites();
  }

  // טוען את כל המתכונים המועדפים של המשתמש
  loadFavorites() {
    this.recipeService.getUserFavorites().subscribe({
      next: (data) => {
        this.favoriteRecipes = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  surpriseMe() {
    if (this.favoriteRecipes.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.favoriteRecipes.length);
      const randomRecipe = this.favoriteRecipes[randomIndex];
      this.router.navigate(['/recipe', randomRecipe.id]);
    }
  }

  getFavoriteCategory(): string {
    if (this.favoriteRecipes.length === 0) return 'אין עדיין';
    const counts: any = {};
    this.favoriteRecipes.forEach(r => counts[r.category] = (counts[r.category] || 0) + 1);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  addToShoppingList(recipe: any, event: Event) {
    event.stopPropagation();
    this.recipeService.addRecipeToShoppingList(recipe.id).subscribe({
      next: () => {
        this.notify.toast(`המצרכים של ${recipe.title} נוספו לרשימת הקניות!`, 'success');
        this.shoppingListCount++; 
      },
      error: (err) => this.notify.alert('שגיאה בהוספה לרשימה', '', 'error')
    });
  }

  getCategoryColor(category: string): string {
    const colors: any = { 'בשרי': '#dc3545', 'חלבי': '#0dcaf0', 'פרווה': '#198754' };
    return colors[category] || '#6c757d';
  }
  // הפונקציה למחיקה מהמועדפים
  removeFromFavorites(recipeId: number, event: Event) {
    event.stopPropagation(); // מונע מעבר לדף המתכון כשלוחצים על האיקס
    
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.id) return;

    // קריאה לסרוויס (שפונה ל-POST /api/recipes/ID/toggle-favorite)
    this.recipeService.toggleFavorite(recipeId, userData.id).subscribe({
      next: (res) => {
        // אם השרת החזיר is_favorite: false, נסיר מהרשימה המקומית
        if (!res.is_favorite) {
          this.favoriteRecipes = this.favoriteRecipes.filter(r => r.id !== recipeId);
        }
      },
      error: (err) => this.notify.alert('שגיאה בהסרת המתכון', '', 'error')
    });
  }
}