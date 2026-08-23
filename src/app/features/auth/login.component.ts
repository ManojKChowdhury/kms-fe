import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
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
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  toggleMode() {
    this.mode.update((m) => (m === 'signin' ? 'register' : 'signin'));
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
        },
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
        },
      });
    }
  }
}
