import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  const token = authService.getAccessToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        // Try refresh
        return authService.refreshToken().pipe(
          switchMap(response => {
            const retried = req.clone({
              setHeaders: { Authorization: `Bearer ${response.accessToken}` }
            });
            return next(retried);
          }),
          catchError(() => {
            authService.logout();
            return throwError(() => error);
          })
        );
      }

      if (error.status === 403) {
        toastService.error('Access Denied', 'You do not have permission for this action.');
      } else if (error.status === 429) {
        toastService.warning('Rate Limited', 'Too many requests. Please wait a moment.');
      } else if (error.status === 503) {
        toastService.error(
          'Pipeline Unavailable',
          'The research pipeline is temporarily unavailable. Please try again shortly.'
        );
      } else if (error.status >= 500) {
        toastService.error(
          'Server Error',
          error.error?.detail ?? 'An unexpected server error occurred.'
        );
      }

      return throwError(() => error);
    })
  );
};
