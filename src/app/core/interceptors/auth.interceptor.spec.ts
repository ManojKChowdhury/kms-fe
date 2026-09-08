import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let getToken: ReturnType<typeof vi.fn>;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getToken = vi.fn();
    next = vi.fn((req) => of(new HttpResponse({ status: 200 })));
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { getToken } }],
    });
  });

  function run(url: string) {
    const req = new HttpRequest('GET', url);
    TestBed.runInInjectionContext(() => authInterceptor(req, next)).subscribe();
    return next.mock.calls[0][0] as HttpRequest<unknown>;
  }

  it('attaches a bearer token to authenticated requests', () => {
    getToken.mockReturnValue('abc123');
    const forwarded = run('/api/v1/documents');
    expect(forwarded.headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('does not attach a token when none is stored', () => {
    getToken.mockReturnValue(null);
    const forwarded = run('/api/v1/documents');
    expect(forwarded.headers.has('Authorization')).toBe(false);
  });

  it('skips the auth header for the login endpoint', () => {
    getToken.mockReturnValue('abc123');
    const forwarded = run('/api/v1/auth/login');
    expect(forwarded.headers.has('Authorization')).toBe(false);
  });
});
