import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.ensureUserLoaded().pipe(
    map(isAuth => {
      if (isAuth) {
        return true;
      }
      router.navigate(['/login']);
      return false;
    })
  );
};

export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.ensureUserLoaded().pipe(
    map(isAuth => {
      if (isAuth) {
        router.navigate(['/dashboard']);
        return false;
      }
      return true;
    })
  );
};
