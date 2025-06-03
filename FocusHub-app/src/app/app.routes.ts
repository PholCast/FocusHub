import { Routes } from '@angular/router';
import { TaskComponent } from './pages/task/task.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { TechniquesComponent } from './pages/techniques/techniques.component';
import { SignInComponent } from './pages/sign-up/sign-up.component';
import { LogInComponent } from './pages/log-in/log-in.component';
import { authGuard } from './shared/guards/auth.guard';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { StatsComponent } from './pages/stats/stats.component';


export const routes: Routes = [
  {
    path: '',
    component: WelcomeComponent
  },
  {
    path: 'sign-up',
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
    path: 'stats',
    component: StatsComponent,
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
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];