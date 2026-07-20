import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./features/auth/login').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'documents/:id',
        loadComponent: () => import('./features/documents/document-detail').then(m => m.DocumentDetailComponent)
      },
      {
        path: 'agents',
        loadComponent: () => import('./features/agents/agent-keys').then(m => m.AgentKeysComponent)
      },
      {
        path: 'chat',
        loadComponent: () => import('./features/chat/global-chat').then(m => m.GlobalChatComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
