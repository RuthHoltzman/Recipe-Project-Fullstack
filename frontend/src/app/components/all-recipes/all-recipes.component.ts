import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // חובה עבור two-way binding עם ngModel
import { environment } from '../../environments/environment';

// דף כל המתכונים - סינון וחיפוש בכל המתכונים
@Component({
  selector: 'app-all-recipes',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './all-recipes.component.html',
  styleUrl: './all-recipes.component.css'
})
export class AllRecipesComponent implements OnInit {
  // --- משתנים עיקריים ---
  allRecipes: Array<any> = []; // כל המתכונים מהשרת
  filteredRecipes: Array<any> = []; // המתכונים המסוננים לתצוגה
  categories: any[] = []; // קטגוריות זמינות
  
  // --- משתני סינון וחיפוש ---
  searchTerm: string = ''; // טקסט חיפוש שהוקלד
  selectedCategory: string = 'הכל'; // קטגוריה שנבחרה (כל היצירות, מרקים וכו')
  selectedType: string = 'All'; // סוג מתכון (בשרי, חלבי וכו')
  sortBy: string = 'newest'; // שיטת מיון (דירוג, זמן וכו')

  apiUrl: string = environment.apiUrl;
  constructor(
    public r: Router,
    private recipeService: RecipeService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // טעינת קטגוריות
    this.recipeService.getCategories().subscribe(data => this.categories = data);

    // טעינת מתכונים
    this.recipeService.getAllRecipes().subscribe((data) => {
      this.allRecipes = data;
      
      // בדיקה אם הגענו עם קטגוריה מה-URL
      this.route.queryParams.subscribe(params => {
        if (params['cat']) {
          this.selectedCategory = params['cat'];
        }
        this.applyFilters(); // הפעלה ראשונית של הסינון המשולב
      });
    });
  }

  // --- הפונקציה המרכזית: משלבת חיפוש + סינון + מיון ---
  applyFilters() {
    let tempRecipes = [...this.allRecipes];

    // 1. סינון לפי קטגוריה
    if (this.selectedCategory !== 'הכל') {
      tempRecipes = tempRecipes.filter(res => res.category === this.selectedCategory);
    }

    // 2. סינון לפי סוג (בשרי/חלבי/פרווה)
    if (this.selectedType !== 'All') {
      tempRecipes = tempRecipes.filter(res => res.type === this.selectedType);
    }

    // 3. סינון לפי חיפוש טקסט
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      tempRecipes = tempRecipes.filter(res => 
        res.title.toLowerCase().includes(term)
      );
    }

    // 4. מיון התוצאות
    tempRecipes = this.sortRecipes(tempRecipes);

    this.filteredRecipes = tempRecipes;
  }

  // פונקציית עזר למיון
  sortRecipes(recipes: any[]) {
    if (this.sortBy === 'rating') {
      return recipes.sort((a, b) => b.rating - a.rating); // מהגבוה לנמוך
    } else if (this.sortBy === 'time') {
      return recipes.sort((a, b) => a.time_to_prepare - b.time_to_prepare); // מהמהיר לאיטי
      } else if (this.sortBy === 'popular') {
    // מיון חדש לפי כמות המועדפים (מהגבוה לנמוך)
    return recipes.sort((a, b) => (b.favorites_count || 0) - (a.favorites_count || 0));
    } else if (this.sortBy === 'newest') {
      return recipes.sort((a, b) => b.id - a.id); // החדשים ביותר קודם
    }
    return recipes;
  }

  // --- פונקציות עדכון (מופעלות מה-HTML) ---

  filterByCat(categoryName: string) {
    this.selectedCategory = categoryName;
    this.applyFilters();
    this.r.navigate([], { queryParams: { cat: categoryName }, relativeTo: this.route });
  }

  filterByType(event: any) {
    this.selectedType = event.target.value;
    this.applyFilters();
  }

  searchRecipes(event: any) {
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  changeSort(event: any) {
    this.sortBy = event.target.value;
    this.applyFilters();
  }

  getCategoryColor(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category ? category.color : '#6c757d';
  }
}