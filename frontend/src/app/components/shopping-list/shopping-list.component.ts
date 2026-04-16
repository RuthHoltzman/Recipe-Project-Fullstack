import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeService } from '../../services/recipe.service';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

// דף רשימת קניות - מוצרים שנוספו מהמתכונים שבחרתי
@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.css']
})
export class ShoppingListComponent implements OnInit {
  items: any[] = []; // רשימת המוצרים
  isLoading = true; // האם עדיין טוענים?

  constructor(
    private notify: NotificationService,
    private recipeService: RecipeService) {}

  // טוען את רשימת הקניות מהשרת
  ngOnInit(): void {
    this.loadList();
  }

  // מחיקת מוצר מרשימת הקניות
  deleteItem(itemId: number, event: Event) {
    event.stopPropagation(); // אל תפעיל Toggle כשלוחצים על פח
    
    if (confirm('למחוק את המצרך הזה?')) {
      this.recipeService.deleteShoppingItem(itemId).subscribe({
        next: () => {
          // עדכן את הרשימה בלי רענון דף
          this.items = this.items.filter(item => item.id !== itemId);
        },
        error: (err) => this.notify.alert('שגיאה במחיקה', '', 'error')
      });
    }
  }

  // טוען את רשימת הקניות מהשרת
  loadList() {
    this.recipeService.getShoppingList().subscribe({
      next: (data) => {
        this.items = data;
        this.isLoading = false;
      },
      error: (err) => console.error(err)
    });
  }

  // סימון פריט כנקנה או ביטול סימון
  toggleItem(item: any) {
    item.is_completed = !item.is_completed;
    // כאן אפשר להוסיף קריאה לשרת שתעדכן את ה-DB בשינוי
  }

 
  
}