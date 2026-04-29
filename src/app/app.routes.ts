import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'research',
    canActivate: [authGuard],
    children: [
      {
        path: 'new',
        loadComponent: () =>
          import('./features/research/submit/submit.component').then(m => m.SubmitComponent)
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/research/history/history.component').then(m => m.HistoryComponent)
      },
      {
        path: ':jobId',
        loadComponent: () =>
          import('./features/research/result/result.component').then(m => m.ResultComponent)
      },
      { path: '', redirectTo: 'new', pathMatch: 'full' }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
