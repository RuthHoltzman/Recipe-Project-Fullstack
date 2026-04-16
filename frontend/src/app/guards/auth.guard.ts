import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService); // הזרקת שירות האימות
  const router = inject(Router);           // הזרקת הנתב

  if (authService.isLoggedIn()) {
    return true; // אם המשתמש מחובר - תן לו להיכנס
  } else {
    // אם לא מחובר - שלח אותו לדף לוגין
    router.navigate(['/login']);
    return false;
  }
};
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // בדיקה 1: האם הוא בכלל מחובר?
  // בדיקה 2: האם התפקיד שלו הוא Admin?
  if (authService.isLoggedIn() && authService.getRole().toLowerCase() === 'admin') {
    return true; // מנהל מאושר - אפשר להיכנס
  } else {
    // אם הוא לא מנהל, נשלח אותו לדף הבית ונוציא הודעה
    alert('גישה זו מיועדת למנהלים בלבד!');
    router.navigate(['/']); 
    return false;
  }
};