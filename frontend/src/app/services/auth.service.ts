import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // הוספתי HttpHeaders
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout() {
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/home']);
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getRole(): string {
    return this.currentUserSubject.value?.role || 'Reader';
  }

  updateProfile(userId: number, formData: FormData) {
    // תיקון: הוספת Header כדי שהשרת יזהה את המשתמש
    const headers = new HttpHeaders().set('User-ID', userId.toString());
    return this.http.put(`${this.apiUrl}/update-profile/${userId}`, formData, { headers });
  }

 requestUpgrade(userId: number): Observable<any> {
  // 1. הגדרת הכותרות
  const headers = new HttpHeaders().set('User-ID', userId.toString());

  // 2. שליחת הבקשה עם הכותרות בתוך אובייקט הגדרות
  return this.http.post(
    `${this.apiUrl}/request-upgrade`, 
    { user_id: userId }, // הגוף (Body)
    { headers: headers }  // הכותרות (Options)
  );
}

getUserRecipes(userId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/user/${userId}/recipes`);
}
}