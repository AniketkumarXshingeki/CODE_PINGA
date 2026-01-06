import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { environment } from '../environment/environment';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;

  // Track login state. BehaviorSubject ensures new subscribers get the latest value immediately.
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedIn.asObservable();

  constructor(private http: HttpClient) {}

  private hasToken(): boolean {
    return !!localStorage.getItem('access_token');
  }

  /**
   * Updates the stream. We pass the token optionally to ensure 
   * the state updates even before the write-to-disk is fully indexed.
   */
  updateLoginStatus(): void {
    this.loggedIn.next(this.hasToken());
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.updateLoginStatus();
  }

  getUsername(): string {
    const token = localStorage.getItem('access_token');
    if (!token) return '';
    try {
      // JWT is header.payload.signature - we take index 1 (payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.username || 'Commander';
    } catch (e) {
      return 'Commander';
    }
  }

  checkEmail(email: string): Observable<{available: boolean}> {
    return this.http.post<{available: boolean}>(`${this.baseUrl}/check-email`, { email });
  }

  /**
   * IMPORTANT: We handle the localStorage here so that updateLoginStatus() 
   * finds the token successfully.
   */
  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data).pipe(
      tap((res: any) => {
        if (res.access_token) {
          localStorage.setItem('access_token', res.access_token);
          this.updateLoginStatus();
        }
      })
    );
  }

  login(credentials: any): Observable<any> {
    // return this.http.post(`${this.baseUrl}/login`, credentials).pipe(
    //   tap((res: any) => {
    //     if (res.access_token) {
    //       localStorage.setItem('access_token', res.access_token);
    //       this.updateLoginStatus();
    //     }
    //   })
    // );

console.log('Mock Login Attempt:', credentials);

  // Fake response that looks like your NestJS JWT response
  const mockResponse = {
    access_token: 'header.' + btoa(JSON.stringify({ username: 'Commander_Test' })) + '.signature'
  };

  // The 'of' function turns the object into an Observable immediately
  return of(mockResponse).pipe(
    tap((res: any) => {
      localStorage.setItem('access_token', res.access_token);
      this.updateLoginStatus();
    })
  );

  }
}