import { CommonModule } from '@angular/common'; // CommonModule לשימוש ב-*ngIf וכו'
import { Component } from '@angular/core'; // Component decorator
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; // כלים לניווט בין דפים
import { AuthService } from './services/auth.service'; // שרות ההרשמה והתחברות

/**
 * AppComponent - הקומפוננטה הראשית (Root)
 * 
 * אחראית על:
 * - הצגת ה-Navbar (סרגל ניווט עליון)
 * - הצגת פרטי המשתמש או כפתור התחברות
 * - ניווט בין כל דפי האפליקציה
 * 
 * Standalone: True - משמעות: הקומפוננטה מנוהלת בעצמה ולא תלויה במודול
 */
@Component({
  selector: 'app-root', // זה הטג שישתמשו בו ב-index.html
  standalone: true, // הקומפוננטה עומדת בעצמה
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule], // ייבוא כל התלויות
  templateUrl: './app.component.html', // קובץ ה-HTML
  styleUrl: './app.component.css' // קובץ ה-CSS
})
export class AppComponent {
  // הזרקת שרות ההרשמה - מאפשר גישה לcurrentUser$ (המשתמש הנוכחי)
  constructor(public authService: AuthService) {}
  
  // שם האפליקציה (לא בשימוש כרגע)
  title = 'frontend';
}
