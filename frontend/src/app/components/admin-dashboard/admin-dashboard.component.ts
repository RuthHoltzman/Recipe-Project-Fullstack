import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// Services
import { RecipeService } from '../../services/recipe.service';
import { AdminService } from '../../services/admin.service'; // שרות עבור פונקציות ניהול
import { NotificationService } from '../../services/notification.service';

import { environment } from '../../environments/environment';

// דף ניהול - אדמין יכול לנהל מתכונים, משתמשים, ודירוגים
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  
  // --- ניהול מצב ---
  recipes: any[] = []; // כל המתכונים בבסיס הנתונים
  users: any[] = []; // כל המשתמשים
  pendingUsers: any[] = []; // משתמשים חדשים ממתינים לאישור

  apiUrl = environment.apiUrl;
  
  isLoading: boolean = true; // האם עדיין טוענים נתונים?
  activeTab: string = 'recipes'; // איזו לשונית פעילה כרגע?

  constructor(
    private recipeService: RecipeService,
    private adminService: AdminService, // הזרקת הסרוויס החדש
    private router: Router,
    private notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.checkAdminAccess();
  }

  /**
   * בדיקת הרשאות אדמין והפניה בהתאם
   */
  private checkAdminAccess(): void {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (userData.role === 'Admin') {
      this.loadAllData();
    } else {
this.notify.alert('גישה נדחתה', 'אין לך גישה לדף זה', 'error');      this.router.navigate(['/']);
    }
  }

  /**
   * טעינת כל הנתונים הדרושים לדשבורד
   * משתמשת בסרוויסים ייעודיים במקום קריאות HTTP ישירות
   */
  loadAllData(): void {
    this.isLoading = true;

    // 1. טעינת מתכונים (מתוך RecipeService הקיים)
    this.recipeService.getAdminRecipes().subscribe({
      next: (data) => {
        this.recipes = data;
        this.checkLoadingComplete(); // בדיקה אם סיימנו לטעון
      },
      error: (err) => {
        console.error('Error loading recipes:', err);
        this.isLoading = false; 
      }
    });

    // 2. טעינת משתמשים (מתוך AdminService החדש)
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data.all_users || [];
        // אם השרת מחזיר גם pending_requests, נשמור אותם (לפי הקוד המקורי שהיה בהערה)
        if (data.pending_requests) {
          this.pendingUsers = data.pending_requests;
        }
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.isLoading = false;
      }
    });
  }

  // פונקציית עזר פשוטה לוודא שהטעינה מסתיימת רק כשהכל הגיע (אופציונלי לשיפור UX)
  private checkLoadingComplete() {
    // בלוגיקה הפשוטה, נשאיר את זה פתוח או נכבה כשאחת הבקשות מסתיימת
    // בקוד המקורי זה כובה בכל סיום בקשה, שמרתי על ההתנהגות הזו:
    this.isLoading = false;
  }

  // --- לוגיקה עסקית: מתכונים ---

  deleteRecipe(id: number): void {
    if (confirm('למחוק את המתכון לצמיתות?')) {
      this.recipeService.deleteRecipeByAdmin(id).subscribe({
        next: () => {
          // עדכון ה-State המקומי ללא קריאה נוספת לשרת
          this.recipes = this.recipes.filter(r => r.id !== id);
        },
        error: (err) => console.error('Error deleting recipe:', err)
      });
    }
  }

  // --- לוגיקה עסקית: משתמשים ---

  approveUser(userId: number): void {
    this.adminService.approveUser(userId).subscribe({
      next: () => {
        this.notify.toast('המשתמש אושר כמעלה תכנים!', 'success');
        this.loadAllData(); // רענון הנתונים מהשרת
      },
      error: () => this.notify.alert('שגיאה באישור המשתמש', 'הייתה תקלה באישור המשתמש', 'error')
    });
  }

  /**
   * העתקת רשימת תפוצה ללוח
   * מסננת משתמשים שביקשו עדכונים ומעתיקה את המיילים שלהם
   */
  copyDistributionList(): void {
    // סינון: רק מי שקיים אצלו true או 1 בשדה wants_updates
    const subscribers = this.users.filter(u => u.wants_updates === true || u.wants_updates === 1);
    
    if (subscribers.length === 0) {
      this.notify.alert('אין משתמשים רשומים לרשימת התפוצה כרגע.', 'אין משתמשים רשומים לרשימת התפוצה כרגע.', 'info');
      return;
    }

    const emailList = subscribers.map(u => u.email).join(', ');

    // שימוש ב-API של הדפדפן להעתקה
    navigator.clipboard.writeText(emailList)
      .then(() => {
        this.notify.toast(`✅ הצלחנו! ${subscribers.length} מיילים הועתקו ללוח.`, 'success');
      })
      .catch(err => {
        console.error('שגיאה בהעתקה:', err);
        this.notify.alert('הייתה בעיה בהעתקה האוטומטית. נסי שוב.', '', 'error');
      });
  }
}