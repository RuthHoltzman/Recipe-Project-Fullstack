import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  // הודעה קופצת מהירה (כמו Toast) שלא עוצרת את המשתמש
  toast(message: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      }
    });
    Toast.fire({ icon, title: message });
  }

  // הודעת אישור (לפני מחיקה או פעולה קריטית)
  async confirm(title: string, text: string) {
    const result = await Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'כן, אני בטוח',
      cancelButtonText: 'ביטול'
    });
    return result.isConfirmed;
  }

  // הודעה רגילה עם כפתור אישור
  alert(title: string, message: string, icon: 'success' | 'error' | 'info' = 'info') {
    Swal.fire(title, message, icon);
  }
}