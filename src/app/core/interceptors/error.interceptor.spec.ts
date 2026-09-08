import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let logout: ReturnType<typeof vi.fn>;
  let error: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    logout = vi.fn();
    error = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { logout } },
        { provide: ToastService, useValue: { error } },
      ],
    });
  });

  function run(url: string, status: number) {
    const req = new HttpRequest('GET', url);
    const next = () => throwError(() => new HttpErrorResponse({ status, url }));
    let caught: unknown;
    TestBed.runInInjectionContext(() => errorInterceptor(req, next)).subscribe({
      error: (e) => {
        caught = e;
      },
    });
    return caught;
  }

  it('logs out and warns on a 401 for a protected request', () => {
    const caught = run('/api/v1/documents', 401);
    expect(logout).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith('Your session has expired. Please sign in again.');
    expect(caught).toBeInstanceOf(HttpErrorResponse);
  });

  it('does not log out on a 401 for a public request', () => {
    run('/api/v1/auth/login', 401);
    expect(logout).not.toHaveBeenCalled();
  });

  it('shows a permission message on 403', () => {
    run('/api/v1/documents', 403);
    expect(error).toHaveBeenCalledWith('You do not have permission to perform this action.');
    expect(logout).not.toHaveBeenCalled();
  });

  it('shows a server error message on 5xx', () => {
    run('/api/v1/documents', 503);
    expect(error).toHaveBeenCalledWith('Server error. Please try again later.');
  });
});
