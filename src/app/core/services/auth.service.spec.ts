import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService, ENVIRONMENT_TOKEN, TOKEN_KEY, type User } from './auth.service';

const environment = {
  apiUrl: 'http://localhost:8000/api/v1',
  wsUrl: 'ws://localhost:8000/api/v1/ws',
};

const AUTH_URL = `${environment.apiUrl}/auth`;

const USER: User = {
  id: 1,
  email: 'user@kms.com',
  is_active: true,
  preferences: { theme: 'light', default_provider: 'openai', summary_length: 'short' },
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    navigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate } },
        { provide: ENVIRONMENT_TOKEN, useValue: environment },
      ],
    });
    // No token stored, so construction issues no /me request.
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('starts unauthenticated when no token is stored', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
  });

  it('fetchCurrentUser populates the currentUser signal', () => {
    service.fetchCurrentUser().subscribe();
    httpMock.expectOne(`${AUTH_URL}/me`).flush(USER);
    expect(service.currentUser()).toEqual(USER);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.userPreferences().theme).toBe('light');
  });

  it('login stores the token and loads the profile', () => {
    service
      .login('user@kms.com', 'pw')
      .subscribe((res) => expect(res.access_token).toBe('jwt-token'));

    const loginReq = httpMock.expectOne(`${AUTH_URL}/login`);
    expect(loginReq.request.method).toBe('POST');
    loginReq.flush({ access_token: 'jwt-token', token_type: 'bearer' });

    expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt-token');

    // Token is now set, so the reset session triggers a /me fetch.
    httpMock.expectOne(`${AUTH_URL}/me`).flush(USER);
    expect(service.currentUser()).toEqual(USER);
  });

  it('logout clears state and redirects to /login', () => {
    localStorage.setItem(TOKEN_KEY, 'jwt-token');
    service.currentUser.set(USER);

    service.logout();

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('logs out when the initial session request fails with an invalid token', () => {
    // Rebuild with a token present so construction warms up the session.
    TestBed.resetTestingModule();
    localStorage.setItem(TOKEN_KEY, 'stale-token');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate } },
        { provide: ENVIRONMENT_TOKEN, useValue: environment },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    httpMock
      .expectOne(`${AUTH_URL}/me`)
      .flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
