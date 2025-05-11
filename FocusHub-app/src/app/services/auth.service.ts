import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { User } from '../shared/interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // LocalStorage keys for user data
  private readonly USERS_KEY = 'users';
  private readonly CURRENT_USER_KEY = 'currentUser';

  constructor(private router: Router) {
    this.currentUser = localStorage.getItem('currentUser')
      ? JSON.parse(localStorage.getItem('currentUser')!)
      : null;
  }
  // Getter/setter for all registered users
  get users(): User[] {
    const usersString = localStorage.getItem(this.USERS_KEY);
    return usersString ? JSON.parse(usersString) : [];
  }

  set users(users: User[]) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }
  // Getter/setter for currently logged in user
  get currentUser(): User | null {
    const currentUserString = localStorage.getItem(this.CURRENT_USER_KEY);
    return currentUserString ? JSON.parse(currentUserString) : null;
  }

  set currentUser(user: User | null) {
    if (user) {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.CURRENT_USER_KEY);
    }
  }

  signUp(userData: User): boolean {
    const { username, email, password } = userData;
    if (!username || !email || !password) {
      console.warn('Validación fallida: Campos vacíos');
      return false;
    }

    const users = this.users;
    if (users.some(user => user.email === email)) {
      console.warn(`Intento de registro con email existente: ${email}`);
      return false;
    }

    const newUser = { username, email, password };
    this.users = [...users, newUser];
    return true;
  }

  logIn(credentials: Pick<User, 'email' | 'password'>): boolean {
    const { email, password } = credentials;
    if (!email || !password) {
      console.warn('Validación fallida: Campos vacíos en login');
      return false;
    }

    const user = this.users.find(user => user.email === email);

    if (!user) {
      console.warn(`Intento de login con email no registrado: ${email}`);
      return false;
    }

    if (user.password !== password) {
      console.warn('Contraseña incorrecta para:', email);
      return false;
    }

    this.currentUser = user;
    return true;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  logOut(): void {
    localStorage.removeItem('currentUser');
    this.currentUser = null;
    this.router.navigate(['/log-in']);

    Swal.fire({
      icon: 'info',
      title: 'Sesión cerrada',
      text: 'Has cerrado sesión correctamente.',
      confirmButtonText: 'Aceptar'
    });

  }
}