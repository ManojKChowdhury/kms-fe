import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { WebSocketService } from './core/services/websocket.service';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainerComponent, ConfirmDialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class App {
  readonly authService = inject(AuthService);
  readonly wsService = inject(WebSocketService);

  toggleTheme() {
    const currentTheme = this.authService.userPreferences().theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.authService.updatePreferences({ theme: newTheme }).subscribe();
  }
}
