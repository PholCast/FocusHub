import { Component, inject } from '@angular/core';
import { RouterLink} from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink],
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
}