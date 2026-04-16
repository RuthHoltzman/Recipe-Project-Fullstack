import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// דף התחברות - משתמשים קיימים מתחברים כאן
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup; // טופס התחברות עם אימייל וסיסמה
  errorMessage: string = ''; // הודעת שגיאה אם ההתחברות נכשלה
  isLoading: boolean = false; // האם מוחכים לתגובה מהשרת?

  constructor(
    private fb: FormBuilder, // FormBuilder ליצירת פורמים
    private authService: AuthService, // שרות ההתחברות
    private router: Router // ניווט
  ) {
    // יצירת טופס עם ולידציות
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], // חובה אימייל תקין
      password: ['', [Validators.required, Validators.minLength(6)]] // חובה סיסמה בן 6+ תווים
    });
  }

  // שליחת טופס התחברות לשרת
  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      // קריאה לשרת עם פרטי התחברות
      this.authService.login(this.loginForm.value).subscribe({
        next: (res) => {
          console.log('התחברת בהצלחה!', res);
          this.router.navigate(['/']); // חזור לדף הבית אחרי התחברות
        },
        error: (err) => {
          // אם ההתחברות נכשלה, הצג הודעת שגיאה
          this.errorMessage = 'פרטי התחברות שגויים, נסה שנית.';
          this.isLoading = false;
        }
      });
    }
  }
}