import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  // Calls your NestJS 'check-email' endpoint
  checkEmail(email: string): Observable<{available: boolean}> {
    return this.http.post<{available: boolean}>(`${this.baseUrl}/check-email`, { email });
  }

  // Calls your NestJS 'register' endpoint
  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  // Calls your NestJS 'login' endpoint
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials);
  }
}