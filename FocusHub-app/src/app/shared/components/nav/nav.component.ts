import { Component, inject, OnInit } from '@angular/core'; // Import OnInit
import { RouterLink, RouterLinkActive} from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css'
})
export class NavComponent implements OnInit { // Implement OnInit
  public authService: AuthService;
  darkmode: boolean = false; // Initialize darkmode state

  constructor() {
    this.authService = inject(AuthService);
  }

  ngOnInit(): void {
    // On component initialization, check localStorage for the saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.darkmode = savedTheme === 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // If no theme is saved, default to light or check system preference
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }

  logout(): void {
    this.authService.logOut();
  }

  modetoggle(): void {
    this.darkmode = !this.darkmode;
    const theme = this.darkmode ? "dark" : "light";
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme); // Save the theme preference to localStorage
  }
}