import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { WebSocketService } from './core/services/websocket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
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
