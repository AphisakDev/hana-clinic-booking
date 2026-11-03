import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** Adds the staff token to admin API calls and logs out when it expires. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isAdminCall = req.url.includes('/admin/') && !req.url.endsWith('/admin/login');
  if (!isAdminCall) return next(req);

  const auth = inject(AuthService);
  const token = auth.token();
  const authed = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authed).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) auth.logout('expired');
      return throwError(() => error);
    }),
  );
};
