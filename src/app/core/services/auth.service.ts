import { Injectable, EnvironmentInjector, effect, computed, signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { InjectionToken } from '@angular/core';
import { Observable, of, tap, map, catchError, shareReplay } from 'rxjs';

export interface UserPreferences {
  theme: string;
  default_provider: string;
  summary_length: string;
}

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  preferences?: UserPreferences;
}

export const TOKEN_KEY = 'kms_token';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  default_provider: 'openai',
  summary_length: 'medium',
};

export const ENVIRONMENT_TOKEN = new InjectionToken<{
  apiUrl: string;
  wsUrl: string;
}>('environment token');

export function environmentProviderFactory() {
  return import('../../../environments/environment').then((mod) => mod.environment);
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly env = inject(ENVIRONMENT_TOKEN, { optional: true });

  private readonly apiUrl: string = this.env?.apiUrl ?? 'http://localhost:8000/api/v1/auth';

  private userLoaded$: Observable<boolean> | undefined;

  // Reactive signals for state management
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly userPreferences = computed(() => this.currentUser()?.preferences ?? DEFAULT_PREFERENCES);

  /** Observable view of the auth state, e.g. for WebSocket lifecycle wiring. */
  readonly isAuthenticated$ = toObservable(this.isAuthenticated);

  constructor() {
    // Warm up the session once at startup; route guards reuse this shared request.
    this.ensureUserLoaded().subscribe();

    // Synchronize theme signal changes with document theme attribute
    effect(() => {
      const prefs = this.userPreferences();
      document.documentElement.setAttribute('data-theme', prefs.theme);
    });
  }

  ensureUserLoaded(): Observable<boolean> {
    if (!this.userLoaded$) {
      // NOTE: token in localStorage is readable by XSS payloads; httpOnly cookies
      // would be safer but require backend support.
      const token = localStorage.getItem(TOKEN_KEY);
      this.userLoaded$ = token
        ? this.fetchCurrentUser().pipe(
            map((user) => !!user),
            catchError(() => {
              this.logout(); // Token stale or invalid
              return of(false);
            }),
            shareReplay(1),
          )
        : of(false);
    }
    return this.userLoaded$;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  register(email: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, { email, password });
  }

  login(email: string, password: string): Observable<{ access_token: string; token_type: string }> {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);

    return this.http
      .post<{ access_token: string; token_type: string }>(`${this.apiUrl}/login`, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.access_token);
          // Reset the cached session and load the fresh user profile immediately.
          this.userLoaded$ = undefined;
          this.ensureUserLoaded().subscribe();
        }),
      );
  }

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap((user) => {
        this.currentUser.set(user);
      }),
    );
  }

  updatePreferences(prefs: Partial<UserPreferences>): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(`${this.apiUrl}/me/preferences`, prefs).pipe(
      tap((updatedPrefs) => {
        const user = this.currentUser();
        if (user) {
          this.currentUser.set({
            ...user,
            preferences: updatedPrefs,
          });
        }
      }),
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this.userLoaded$ = undefined;
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
