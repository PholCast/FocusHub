
import { Routes } from '@angular/router';
import { TaskComponent } from './pages/task/task.component';
import { CalendarComponent } from './pages/calendar/calendar.component';

export const routes: Routes = [
  {
    path: 'tasks',
    component: TaskComponent
  },
  {
    path: 'calendar',
    component: CalendarComponent
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