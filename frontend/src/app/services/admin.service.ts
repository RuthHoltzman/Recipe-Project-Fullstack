// services/admin.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl + '/admin'; // כתובת בסיס

  constructor(private http: HttpClient) {}

  // פונקציית עזר פרטית ליצירת Headers
  // מונעת שכפול קוד בקומפוננטה
  private getAuthHeaders(): HttpHeaders {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = userData.id ? userData.id.toString() : '';
    return new HttpHeaders().set('User-ID', userId);
  }

  // שליפת כל המשתמשים
  getAllUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // אישור משתמש
  approveUser(userId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/approve-user/${userId}`, 
      {}, 
      { headers: this.getAuthHeaders() }
    );
  }
}