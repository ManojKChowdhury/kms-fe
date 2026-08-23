import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-wrapper">
      <div class="glow-bg"></div>
      <div class="login-card glass">
        <h2 class="login-title gradient-text">{{ mode() === 'register' ? 'Create Account' : 'Login' }}</h2>
        <p class="login-subtitle">AI-Powered Knowledge Management System</p>

        @if (errorMessage()) {
          <div class="error-banner">{{ errorMessage() }}</div>
        }

        @if (successMessage()) {
          <div class="success-banner">{{ successMessage() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              class="form-input"
              formControlName="email"
              required
              email
              placeholder="name@company.com"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              class="form-input"
              formControlName="password"
              required
              minlength="6"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" class="btn btn-primary login-btn" [disabled]="loginForm.invalid || isLoading()">
            {{ isLoading() ? 'Processing...' : (mode() === 'register' ? 'Sign Up' : 'Sign In') }}
          </button>
        </form>

        <div class="toggle-mode">
          <span>{{ mode() === 'register' ? 'Already have an account?' : 'New to KMS?' }}</span>
          <button type="button" class="toggle-btn" (click)="toggleMode()">
            {{ mode() === 'register' ? 'Sign In' : 'Create an account' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .login-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      width: 100vw;
      position: relative;
      background-color: var(--bg-primary);
      overflow: hidden;
    }

    .glow-bg {
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, var(--accent-cyan-glow) 0%, var(--accent-purple-glow) 50%, transparent 100%);
      filter: blur(60px);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      padding: 3rem;
      position: relative;
      z-index: 10;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
    }

    .login-title {
      font-size: 2.25rem;
      font-weight: 800;
      text-align: center;
      margin-bottom: 0.5rem;
      font-family: var(--font-family-heading);
    }

    .login-subtitle {
      font-size: 0.9rem;
      color: var(--text-secondary);
      text-align: center;
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
      display: block;
      margin-bottom: 0.5rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-family: var(--font-family-sans);
      font-size: 0.95rem;
      outline: none;
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }

    .form-input:focus {
      border-color: var(--accent-cyan);
      box-shadow: 0 0 0 3px var(--accent-cyan-glow);
    }

    .error-banner {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: var(--danger);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
      text-align: center;
    }

    .success-banner {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: var(--success);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
      text-align: center;
    }

    .toggle-mode {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-secondary);
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }

    .toggle-btn {
      background: transparent;
      border: none;
      color: var(--accent-cyan);
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-family-sans);
    }
    .toggle-btn:hover {
      color: var(--accent-purple);
      text-decoration: underline;
    }

    .login-btn {
      width: 100%;
      margin-top: 1.5rem;
      padding: 0.85rem;
      font-size: 1rem;
      font-weight: 600;
    }
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(NonNullableFormBuilder);

  mode = signal<'signin' | 'register'>('signin');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  toggleMode() {
    this.mode.update(m => m === 'signin' ? 'register' : 'signin');
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.form.controls.password.reset();
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.mode() === 'register') {
      this.authService.register(email, password).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.successMessage.set('Account created successfully! Please sign in.');
          this.mode.set('signin');
          this.form.controls.password.reset();
        },
        error: (err) => {
          this.isLoading.set(false);
          const msg = (err as Error)?.message || 'Registration failed. Try again.';
          this.errorMessage.set(msg);
        }
      });
    } else {
      this.authService.login(email, password).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
          const msg = (err as Error)?.message || 'Incorrect email or password.';
          this.errorMessage.set(msg);
        }
      });
    }
  }
}
