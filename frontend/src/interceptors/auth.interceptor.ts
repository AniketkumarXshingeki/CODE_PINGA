import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../environment/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  
  // 1. Define which URL base we want to protect
  const isBackendRequest = req.url.startsWith(environment.apiUrl);
  
  // 2. Define public routes that should NEVER have a token (optional but cleaner)
  const isPublicRoute = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  // 3. Only add the token if it's our backend AND not a public route
  if (token && isBackendRequest && !isPublicRoute) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};