import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { environment } from '../environment/environment';
import { catchError, delay, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

export interface User {
  playerId: string;
  username: string;
}
@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;

  currentUser = signal<User | null>(null);


  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object // Correct SSR Injection
  ) {}

  checkAuth(): Observable<User | null> {
    return this.http.get<User>(`${this.baseUrl}/me`, { withCredentials: true }).pipe(
      tap((user) => {
        console.log('Auth Check Success:', user);
        this.currentUser.set(user);
      }),
      catchError((err) => {
        // 401 Unauthorized means no valid cookie
        console.log('Auth Check Failed (User is Guest)');
        this.currentUser.set(null);
        return of(null);
      })
    );
  }
 
  checkEmail(email: string): Observable<{available: boolean}> {
    return this.http.post<{available: boolean}>(`${this.baseUrl}/check-email`, { email });
    // return of({ available: true }).pipe(
    // delay(500)
    // );
  }


register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data,).pipe(
      tap(() => {
        // After register (auto-login), fetch user details
        this.checkAuth().subscribe();
      })
    );
  }

login(credentials: any): Observable<any> {
    // We expect the backend to set the cookie. We don't receive a token in the body anymore.
    return this.http.post(`${this.baseUrl}/login`, credentials,).pipe(
      tap(() => {
        // After login succeeds, immediately fetch the user details
        this.checkAuth().subscribe();
      })
    );
  }

  logout(): Observable<any> {
    // We must tell the backend to clear the cookie
    return this.http.post(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => {
        this.currentUser.set(null);
      })
    );
  }

  get username(): string {
    return this.currentUser()?.username || 'Commander';
  }

  get userId(): string {
    return this.currentUser()?.playerId || '';
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser();
  }
}