import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

// דף הרשמה - משתמשים חדשים יוצרים חשבון כאן
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css' // אותו עיצוב של הלוגין
})
export class RegisterComponent {
  registerForm: FormGroup; // טופס הרשמה
  errorMessage: string = ''; // הודעת שגיאה אם ההרשמה נכשלה
  isLoading: boolean = false; // האם מוחכים לתגובה מהשרת?

  constructor(
    private notify: NotificationService,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // יצירת טופס הרשמה עם כל הפרטים הדרושים
    this.registerForm = this.fb.group({
      first_name: ['', [Validators.required]], // שם חובה
      last_name: ['', [Validators.required]], // שם משפחה חובה
      email: ['', [Validators.required, Validators.email]], // אימייל תקין חובה
      phone: ['', [Validators.required, Validators.pattern('^[0-9]*$')]], // רק מספרים
      password: ['', [Validators.required, Validators.minLength(6)]], // סיסמה בן 6+ תווים
      confirmPassword: ['', [Validators.required]], // אימות סיסמה חובה
      wants_updates: [false] // האם רוצה עדכונים? (לא סומן כברירה ברירת מחדל)
    }, { validators: this.passwordMatchValidator }); // בדיקה שהסיסמאות זהות
  }

  // ולידטור מותאם - בדוק שהסיסמה והאימות זהים
  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  // שליחת טופס ההרשמה לשרת
  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      
      // שליחת כל פרטי ההרשמה לשרת
      const registrationData = this.registerForm.value; 
      
      this.authService.register(registrationData).subscribe({
        next: (res) => {
          // אם ההרשמה הצליחה
          this.notify.toast('נרשמת בהצלחה! כעת ניתן להתחבר', 'success');
          this.router.navigate(['/login']); // עבור לעמוד התחברות
        },
        error: (err) => {
          // אם ההרשמה נכשלה
          this.errorMessage = err.error?.message || 'שגיאה בהרשמה';
          this.isLoading = false;
        }
      });
    }
}
}