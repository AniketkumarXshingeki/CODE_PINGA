import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { environment } from '../environment/environment';
import { delay, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;

  // Track login state. BehaviorSubject ensures new subscribers get the latest value immediately.
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedIn.asObservable();

constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object // Correct SSR Injection
  ) {
    // Check for token only once we are on the client side
    if (isPlatformBrowser(this.platformId)) {
      this.updateLoginStatus();
    }
  }
 
  // Safe helper to check localStorage only on client
  private hasToken(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('access_token');
    }
    return false;
  }
  /**
   * Updates the stream. We pass the token optionally to ensure 
   * the state updates even before the write-to-disk is fully indexed.
   */
  updateLoginStatus(): void {
    this.loggedIn.next(this.hasToken());
  }

logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
      this.updateLoginStatus();
    }
  }

getUsername(): string {
    if (!isPlatformBrowser(this.platformId)) return 'Commander';
    
    const token = localStorage.getItem('access_token');
    if (!token) return 'Commander';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.username || 'Commander';
    } catch (e) {
      return 'Commander';
    }
  }
  getUserId(): string {
  if (!isPlatformBrowser(this.platformId)) return '';
  
  const token = localStorage.getItem('access_token');
  if (!token) return '';
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Check 'sub' (standard JWT) or 'playerId' (common custom name)
    return payload.sub || payload.playerId || payload.id || '';
  } catch (e) {
    console.error('Error decoding token for userId', e);
    return '';
  }
}
  checkEmail(email: string): Observable<{available: boolean}> {
    return this.http.post<{available: boolean}>(`${this.baseUrl}/check-email`, { email });
    // return of({ available: true }).pipe(
    // delay(500)
    // );
  }


  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data).pipe(
      tap((res: any) => {
        if (res.access_token) {
          localStorage.setItem('access_token', res.access_token);
          this.updateLoginStatus();
        }
      })
    );

  //   console.log('Mocking Registration for:', data);

  // // 1. Create a fake JWT token
  // // We encode the username into the middle part of the string so getUsername() works
  // const fakeToken = 'manual_header.' + btoa(JSON.stringify({ 
  //   username: data.username || 'NewPlayer',
  //   email: data.email 
  // })) + '.manual_signature';

  // // 2. Create the fake server response
  // const mockResponse = {
  //   access_token: fakeToken,
  //   user: { email: data.email, username: data.username }
  // };

  // // 3. Return the fake response as an Observable
  // return of(mockResponse).pipe(
  //   delay(800), // Simulate a short network delay for realism
  //   tap((res: any) => {
  //     // This logic ensures your Navbar and Home page react immediately
  //     if (res.access_token) {
  //       localStorage.setItem('access_token', res.access_token);
  //       this.updateLoginStatus();
  //     }
  //   })
  // );
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials).pipe(
      tap((res: any) => {
        if (res.access_token) {
          localStorage.setItem('access_token', res.access_token);
          this.updateLoginStatus();
        }
      })
    );

// console.log('Mock Login Attempt:', credentials);

//   // Fake response that looks like your NestJS JWT response
//   const mockResponse = {
//     access_token: 'header.' + btoa(JSON.stringify({ username: 'Commander_Test' })) + '.signature'
//   };

//   // The 'of' function turns the object into an Observable immediately
//   return of(mockResponse).pipe(
//     tap((res: any) => {
//       localStorage.setItem('access_token', res.access_token);
//       this.updateLoginStatus();
//     })
//   );

  }
}