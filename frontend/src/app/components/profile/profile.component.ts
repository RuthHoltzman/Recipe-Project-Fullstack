import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  // משתנים לשמירת נתוני המשתמש והמצב של הדף
  user: any;
  backupUser: any; // גיבוי לנתונים למקרה של ביטול עריכה
  isEditing: boolean = false;
  requestSent: boolean = false;
  userRecipes: any[] = [];

  // משתנים לניהול המצלמה
  showCameraModal: boolean = false;
  stream: MediaStream | null = null;
  apiUrl: string = environment.apiUrl;
  constructor(
    public authService: AuthService,
    private notify: NotificationService
  ) {}

  /**
   * ngOnInit: פונקציה שרצה ברגע שהקומפוננטה עולה.
   * היא טוענת את המידע ומאזינה לשינויים ב-Observable של המשתמש.
   */

  ngOnInit() {
    this.loadUserData();
    this.authService.currentUser$.subscribe((u) => {
      if (u) {
        this.user = { ...u };
        this.backupUser = { ...u };
        this.loadUserRecipes(); // <-- קריאה לפונקציה החדשה
      }
    });
  }

  /**
   * loadUserData: טוענת את נתוני המשתמש מה-LocalStorage של הדפדפן.
   */
  loadUserData() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.backupUser = { ...this.user };
    }
  }

  /**
   * startEdit: מעבירה את הטופס למצב עריכה ושומרת גיבוי של הנתונים הנוכחיים.
   */
  startEdit() {
    this.backupUser = { ...this.user };
    this.isEditing = true;
  }

  /**
   * cancelEdit: מבטלת את העריכה, מחזירה את הנתונים מהגיבוי וסוגרת מצלמה.
   */
  cancelEdit() {
    this.stopCamera();
    this.user = { ...this.backupUser };
    this.isEditing = false;
  }

  /**
   * saveChanges: הפונקציה המרכזית לשמירת נתונים.
   * אורזת את המידע ב-FormData (כולל המרת התמונה לקובץ) ושולחת לשרת.
   */
  saveChanges() {
    const formData = new FormData();

    // הוספת שדות הטקסט
    formData.append('first_name', this.user.first_name || '');
    formData.append('last_name', this.user.last_name || '');
    formData.append('phone', this.user.phone || '');
    formData.append('wants_updates', String(this.user.wants_updates));

    // אם המשתמש צילם/בחר תמונה חדשה (פורמט Base64), נמיר אותה לקובץ (Blob)
    if (
      this.user.profile_image &&
      this.user.profile_image.startsWith('data:image')
    ) {
      const blob = this.dataURItoBlob(this.user.profile_image);
      formData.append('profile_image', blob, 'profile_pic.png');
    }

    this.authService.updateProfile(this.user.id, formData).subscribe({
      next: (res: any) => {
        this.user = { ...res.user };
        localStorage.setItem('user', JSON.stringify(this.user));
        this.backupUser = { ...this.user };
        this.isEditing = false;
        this.notify.toast('הפרופיל עודכן בהצלחה! ✅', 'success');
      },
      error: (err) => {
        console.error(err);
        this.notify.alert('שגיאה בעדכון הפרופיל.', '', 'error');
      },
    });
  }

  /**
   * dataURItoBlob: פונקציית עזר טכנית.
   * מקבלת מחרוזת טקסט של תמונה (Base64) והופכת אותה לאובייקט קובץ בינארי (Blob).
   */
  dataURItoBlob(dataURI: string) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  /**
   * requestUploaderPermission: שולחת בקשה למנהל להפוך את המשתמש ל"מעלה תוכן".
   */
  requestUploaderPermission() {
    if (this.user) {
      this.authService.requestUpgrade(this.user.id).subscribe({
        next: () => {
          this.requestSent = true;
          this.notify.toast('הבקשה נשלחה!', 'success');
        },
        error: () => this.notify.alert('שגיאה בשליחת הבקשה', '', 'error'),
      });
    }
  }

  /**
   * onFileSelected: מטפלת בבחירת קובץ מהמחשב.
   * קוראת את הקובץ ומציגה אותו בתצוגה מקדימה.
   */
  onFileSelected(event: any) {
    if (!this.isEditing) return;

    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.user.profile_image = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * startCamera: פותחת את המצלמה של המחשב/טלפון ומציגה את הוידאו במודאל.
   */
  async startCamera() {
    if (!this.isEditing) return;
    this.showCameraModal = true;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoElement = document.getElementById(
        'webcam'
      ) as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = this.stream;
      }
    } catch (err) {
      this.notify.alert(
        'שגיאת מצלמה',
        'לא ניתן לגשת למצלמה. וודאי שנתת הרשאה בדפדפן',
        'error'
      );
      this.showCameraModal = false;
    }
  }

  /**
   * captureImage: לוקחת "פריים" (תמונה) מתוך הוידאו החי של המצלמה ושומרת אותו.
   */
  captureImage() {
    try {
      const video = document.getElementById('webcam') as HTMLVideoElement;
      if (!video) {
        this.notify.alert('שגיאה', 'לא ניתן למצוא את אלמנט המצלמה', 'error');
        return;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        this.user.profile_image = canvas.toDataURL('image/png');
        this.notify.toast('תמונה צולמה בהצלחה! ✅', 'success');
      }
    } catch (err) {
      console.error('Error capturing image:', err);
      this.notify.alert('שגיאה', 'לא ניתן לצלם תמונה', 'error');
    } finally {
      this.stopCamera();
    }
  }

  /**
   * stopCamera: מפסיקה את פעולת המצלמה ומשחררת את המשאבים.
   */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
    }
    this.showCameraModal = false;
  }
  // profile.component.ts

  getFullImageUrl(imagePath: string): string {
    if (!imagePath) return '';

    // אם זו תמונה מהמצלמה (Base64), נחזיר אותה כפי שהיא
    if (imagePath.startsWith('data:image')) {
      return imagePath;
    }

    // אם זה נתיב מהשרת (מתחיל ב-/), נוסיף את כתובת השרת
    if (imagePath.startsWith('/')) {
      return `${this.apiUrl}${imagePath}`;
    }

    return imagePath;
  }
  // 3. הוסיפי את הפונקציה שטוענת את המתכונים
  loadUserRecipes() {
    if (this.user?.id) {
      this.authService.getUserRecipes(this.user.id).subscribe({
        next: (recipes) => {
          this.userRecipes = recipes;
        },
        error: (err) => {
          console.error('Error fetching user recipes:', err);
        },
      });
    }
  }
}
