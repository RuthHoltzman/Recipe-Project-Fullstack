import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RecipeService } from '../../services/recipe.service';
import { NotificationService } from '../../services/notification.service';

// דף הוסף מתכון חדש - יוצרים מתכון חדש עם מצרכים הוראות וכו'
@Component({
  selector: 'app-add-recipe',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-recipe.component.html',
  styleUrl: './add-recipe.component.css'
})
export class AddRecipeComponent implements OnInit {
  
  // --- פרטי המתכון הכללים ---
  recipe = {
    title: '', // שם המתכון
    description: '', // תיאור קצר
    type: '', // סוג (בשרי, חלבי וכו')
    time_to_prepare: 30, // זמן הכנה בדקות
    category: '', // קטגוריה (מרק, עוגה וכו')
    difficulty: 'קל', // רמת קושי
    servings: 1 // כמה סועדים
  };

  // --- ניהול רשימות דינמיות ---
  
  // מערך המצרכים (מתחיל עם 3 שורות ריקות)

  ingredientsList: Array<{ amount: number, unit: string, product_name: string }> = [];
  
  // מערך הוראות ההכנה (מתחיל עם 3 שורות)
  instructionsList: Array<string> = [];

  // רשימת יחידות מידה לבחירה
  units = ['יחידה', 'גרם', 'ק"ג', 'כף', 'כפית', 'כוס', 'מ"ל', 'ליטר', 'חבילה', 'קורט'];

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isLoading = false;
  user: any;
  categories: any[] = [];

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(userData => { this.user = userData; });
    this.recipeService.getCategories().subscribe(data => this.categories = data);

    // אתחול עם 3 שורות ריקות למצרכים
    for (let i = 0; i < 3; i++) {
      this.addIngredient();
    }

    // אתחול עם 3 שורות ריקות להוראות
    for (let i = 0; i < 3; i++) {
      this.addInstruction();
    }
  }

  // --- פונקציות ניהול מצרכים ---
  addIngredient() {
    this.ingredientsList.push({ amount: 1, unit: 'יחידה', product_name: '' });
  }

  removeIngredient(index: number) {
    if (this.ingredientsList.length > 1) {
      this.ingredientsList.splice(index, 1);
    }
  }

  // --- פונקציות ניהול הוראות ---
  addInstruction() {
    this.instructionsList.push('');
  }

  removeInstruction(index: number) {
    if (this.instructionsList.length > 1) {
      this.instructionsList.splice(index, 1);
    }
  }

  // פונקציית עזר לאנגולר כדי לא לאבד פוקוס במערכים של טקסט
  trackByIndex(index: number, obj: any): any {
    return index;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  onAddRecipe() {
    if (!this.user || !this.selectedFile) {
      this.notify.alert('חסרים פרטים', 'נא לוודא שאתה מחובר ושצירפת תמונה', 'error');
      return;
    }

    this.isLoading = true;

    // 1. סינון מצרכים ריקים (כאלה שאין להם שם)
    const finalIngredients = this.ingredientsList.filter(ing => ing.product_name.trim() !== '');

    // 2. איחוד ההוראות לטקסט אחד (כי השרת שומר את זה כ-Text)
    // אנו מוחקים שורות ריקות ומחברים עם ירידת שורה
    const finalInstructions = this.instructionsList
  .filter(step => step.trim() !== '') // מסנן שורות ריקות
  .map((step, index) => `${index + 1}. ${step}`) // מוסיף מספר, נקודה ורווח בתחילת כל שורה
  .join('\n'); // מחבר את הכל עם ירידת שורה

    if (finalIngredients.length === 0 || finalInstructions.length === 0) {
      this.notify.toast('חובה למלא לפחות מצרך אחד והוראה אחת', 'warning');
      this.isLoading = false;
      return;
    }

    // הכנת האובייקט לשליחה
    const recipeToSend = {
      ...this.recipe,
      instructions: finalInstructions // דריסת השדה עם הטקסט המאוחד
    };

    this.recipeService.addRecipe(
      recipeToSend, 
      finalIngredients, 
      this.selectedFile, 
      this.user.id
    ).subscribe({
      next: () => {
        this.notify.toast('המתכון פורסם בהצלחה!', 'success');
      },
      error: (err) => {
        console.error('שגיאה:', err);
        this.notify.toast('הייתה תקלה בשמירה', 'error');
        this.isLoading = false;
      }
    });
  }

  resetForm() {
    this.recipe = {
      title: '', description: '', type: '', time_to_prepare: 30,
      category: '', difficulty: 'קל', servings: 1
    };
    
    // איפוס הרשימות מחדש ל-3 שורות
    this.ingredientsList = [];
    this.instructionsList = [];
    for (let i = 0; i < 3; i++) this.addIngredient();
    for (let i = 0; i < 3; i++) this.addInstruction();

    this.selectedFile = null;
    this.imagePreview = null;
    this.isLoading = false;
  }
}