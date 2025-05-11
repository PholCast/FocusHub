import { Routes } from '@angular/router';
import { TaskComponent } from './pages/task/task.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { TechniquesComponent } from './techniques/techniques.component';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { LogInComponent } from './pages/log-in/log-in.component';
import { authGuard } from './shared/guards/auth.guard';


export const routes: Routes = [
  {
    path: 'sign-in',
    component: SignInComponent
  },
  {
    path: 'log-in',
    component: LogInComponent
  },
  {
    path: 'tasks',
    component: TaskComponent,
    canActivate: [authGuard]
  },
  {
    path: 'techniques',
    component: TechniquesComponent,
    title: 'Técnicas de concentración',
    canActivate: [authGuard]
  },
  {
    path: 'calendar',
    component: CalendarComponent,
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: '/tasks',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/tasks'
  }
];
