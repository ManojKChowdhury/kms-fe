import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:8000/api/v1/auth';
  private userLoaded$?: Observable<boolean>;
  
  // Reactive signals for state management
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly userPreferences = computed(() => this.currentUser()?.preferences || { theme: 'dark', default_provider: 'openai', summary_length: 'medium' });

  constructor(private http: HttpClient, private router: Router) {
    // Check for existing token and load user
    this.loadUserFromStorage();

    // Synchronize theme signal changes with document theme attribute
    effect(() => {
      const prefs = this.userPreferences();
      document.documentElement.setAttribute('data-theme', prefs.theme);
    });
  }

  ensureUserLoaded(): Observable<boolean> {
    if (this.currentUser()) {
      return of(true);
    }
    const token = this.getToken();
    if (!token) {
      return of(false);
    }
    if (!this.userLoaded$) {
      this.userLoaded$ = this.fetchCurrentUser().pipe(
        map(user => !!user),
        catchError(() => {
          this.logout();
          return of(false);
        }),
        shareReplay(1)
      );
    }
    return this.userLoaded$;
  }

  private loadUserFromStorage() {
    const token = this.getToken();
    if (token) {
      this.fetchCurrentUser().subscribe({
        error: () => this.logout() // Token stale or invalid
      });
    }
  }

  getToken(): string | null {
    return localStorage.getItem('kms_token');
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders(token ? { 'Authorization': `Bearer ${token}` } : {});
  }

  register(email: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, { email, password });
  }

  login(email: string, password: string): Observable<{ access_token: string, token_type: string }> {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post<{ access_token: string, token_type: string }>(
      `${this.apiUrl}/login`,
      body.toString(),
      { headers }
    ).pipe(
      tap(res => {
        localStorage.setItem('kms_token', res.access_token);
        this.userLoaded$ = undefined;
        this.loadUserFromStorage();
      })
    );
  }

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`, { headers: this.getAuthHeaders() }).pipe(
      tap(user => {
        this.currentUser.set(user);
      })
    );
  }

  updatePreferences(prefs: Partial<UserPreferences>): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(`${this.apiUrl}/me/preferences`, prefs, { headers: this.getAuthHeaders() }).pipe(
      tap(updatedPrefs => {
        const user = this.currentUser();
        if (user) {
          this.currentUser.set({
            ...user,
            preferences: updatedPrefs
          });
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('kms_token');
    this.currentUser.set(null);
    this.userLoaded$ = undefined;
    this.router.navigate(['/login']);
  }
}
