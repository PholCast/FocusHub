import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { User } from '../shared/interfaces/user.interface';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private router: Router,
    private tokenService: TokenService
  ) {}

  signUp(userData: User) {
    return this.http.post(`${environment.apiUrl}/auth/register`, userData);
  }

  logIn(credentials: { email: string; password: string }) {
    return this.http.post<{ access_token: string; user: User }>(
      `${environment.apiUrl}/auth/login`,
      credentials
    ).pipe(
      tap(response => {
        this.tokenService.setToken(response.access_token);
      })
    );
  }

  logOut() {
    this.tokenService.clearToken();
    this.router.navigate(['/log-in']);
    Swal.fire({
      title: "Sesión cerrada",
      text: "Has cerrado sesión correctamente.",
      icon: "info",
      confirmButtonText: "Aceptar"
    });
  }

  isAuthenticated(): boolean {
    return !!this.tokenService.getToken() && !this.tokenService.isTokenExpired();
  }

  getCurrentUserId(): number | null {
    const payload = this.tokenService.decodeToken();
    return payload?.sub ?? null; // 
  }

  getToken(): string | null {
    return this.tokenService.getToken();
  }
}
