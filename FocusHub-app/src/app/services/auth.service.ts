import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { User } from '../shared/interfaces/user.interface';
import { environment } from '../../environments/environment'; // Asegúrate de tener tu URL base aquí

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';

  constructor(private http: HttpClient, private router: Router) {}

  // Método para registrar un usuario
  signUp(userData: User) {
    return this.http.post(`${environment.apiUrl}/auth/register`, userData).subscribe({
      next: () => {
        Swal.fire({
          title: "Éxito",
          text: "Registro exitoso, ahora puedes iniciar sesión.",
          icon: "success",
          confirmButtonText: "Aceptar"
        });
        this.router.navigate(['/log-in']);
      },
      error: () => {
        Swal.fire({
          title: "Error",
          text: "Error al registrar el usuario.",
          icon: "error",
          confirmButtonText: "Aceptar"
        });
      }
    });
  }

  // Método para iniciar sesión
  logIn(credentials: { email: string; password: string }) {
    return this.http.post<{ access_token: string; user: User }>(`${environment.apiUrl}/auth/login`, credentials).subscribe({
      next: (response) => {
        this.setToken(response.access_token);
        this.router.navigate(['/home']);
        Swal.fire({
          title: "Éxito",
          text: `Bienvenido, ${response.user.name}!`,
          icon: "success",
          confirmButtonText: "Aceptar"
        });
      },
      error: () => {
        Swal.fire({
          title: "Error",
          text: "Credenciales incorrectas.",
          icon: "error",
          confirmButtonText: "Aceptar"
        });
      }
    });
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
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
