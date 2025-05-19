import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { User } from '../shared/interfaces/user.interface';
import { environment } from '../../environments/environment'; // Asegúrate de tener tu URL base aquí
import { tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';

  constructor(private http: HttpClient, private router: Router) {}

  // Método para registrar un usuario
  signUp(userData: User) {
    return this.http.post(`${environment.apiUrl}/auth/register`, userData);
  }


  // Método para iniciar sesión
logIn(credentials: { email: string; password: string }) {
  return this.http.post<{ access_token: string; user: User }>(
    `${environment.apiUrl}/auth/login`, 
    credentials
  ).pipe(
    tap(response => {
      this.setToken(response.access_token); // <- ✅ Aquí guardas el token
    })
  );
}

  // Método para cerrar sesión
  logOut() {
    this.clearToken();
    this.router.navigate(['/log-in']);
    Swal.fire({
      title: "Sesión cerrada",
      text: "Has cerrado sesión correctamente.",
      icon: "info",
      confirmButtonText: "Aceptar"
    });
  }

  // Métodos para manejar el token
  private setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private clearToken() {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    console.log('[authInterceptor] token:', this.TOKEN_KEY);
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ✅ Nuevo método para obtener el ID del usuario actual desde el JWT
  getCurrentUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub ?? null; // O payload.user_id si así lo envía tu backend
    } catch (e) {
      console.error('Error decoding token', e);
      return null;
    }
  }
}
