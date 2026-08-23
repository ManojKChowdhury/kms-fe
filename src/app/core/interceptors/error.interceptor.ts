import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

const PUBLIC_ENDPOINTS = ['/auth/login', '/auth/register'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      const isPublicRequest = PUBLIC_ENDPOINTS.some((path) => req.url.includes(path));

      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 && !isPublicRequest) {
          authService.logout();
          toast.error('Your session has expired. Please sign in again.');
        } else if (error.status === 403) {
          toast.error('You do not have permission to perform this action.');
        } else if (error.status >= 500) {
          toast.error('Server error. Please try again later.');
        }
      }

      return throwError(() => error);
    }),
  );
};
