import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config'; // 👈 importa tu config

bootstrapApplication(AppComponent, appConfig) // ✅ usa tu appConfig completo
  .catch(err => console.error(err));
