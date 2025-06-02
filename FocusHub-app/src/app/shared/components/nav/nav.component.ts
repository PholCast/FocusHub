import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive} from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css'
})
export class NavComponent {
  
  public authService: AuthService;

  constructor() {
    this.authService = inject(AuthService);

  }

  logout(): void {
    this.authService.logOut();
  }

  darkmode = false;
  modetoggle(){
    this.darkmode = !this.darkmode;
    document.documentElement.setAttribute('data-theme', this.darkmode ? "dark" : "light");
  }
}