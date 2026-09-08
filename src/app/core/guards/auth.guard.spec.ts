import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { type Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authGuard, noAuthGuard } from './auth.guard';

function runGuard(guard: typeof authGuard): Observable<boolean> {
  return TestBed.runInInjectionContext(
    () => guard(null as never, null as never) as Observable<boolean>,
  );
}

describe('auth guards', () => {
  let ensureUserLoaded: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ensureUserLoaded = vi.fn();
    navigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { ensureUserLoaded } },
        { provide: Router, useValue: { navigate } },
      ],
    });
  });

  it('authGuard allows access when authenticated', () => {
    ensureUserLoaded.mockReturnValue(of(true));
    runGuard(authGuard).subscribe((result) => {
      expect(result).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  it('authGuard redirects to /login when unauthenticated', () => {
    ensureUserLoaded.mockReturnValue(of(false));
    runGuard(authGuard).subscribe((result) => {
      expect(result).toBe(false);
      expect(navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  it('noAuthGuard redirects authenticated users to /dashboard', () => {
    ensureUserLoaded.mockReturnValue(of(true));
    runGuard(noAuthGuard).subscribe((result) => {
      expect(result).toBe(false);
      expect(navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  it('noAuthGuard allows unauthenticated users through', () => {
    ensureUserLoaded.mockReturnValue(of(false));
    runGuard(noAuthGuard).subscribe((result) => {
      expect(result).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
