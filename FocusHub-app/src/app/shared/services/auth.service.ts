import { Injectable, signal } from '@angular/core';
import { User } from '../interfaces/user.interface';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  isLogged = signal(this.currentUserExists());

  userTechnician = signal(this.isTechnician())

  private getStoredUsers(): User[] {
    return JSON.parse(localStorage.getItem('users') || '[]');
  }

  login(usernameOrEmail: string, password: string,role:string): boolean {

    const users = this.getStoredUsers();
    
    const user = users.find((u: User) => 
      (u.username.toLowerCase() === usernameOrEmail.toLowerCase() || 
    u.email.toLowerCase() === usernameOrEmail.toLowerCase()) && 
    u.role.toLowerCase() === role.toLowerCase() );
    
    if (user && user.password === password) {
      this.isLogged.set(true);
      localStorage.setItem('currentUser',JSON.stringify(user));
      this.userTechnician.set(this.isTechnician());
      return true;
    }
    return false;
  }

  logout(): void {
    this.isLogged.set(false);
    localStorage.removeItem('currentUser');
    this.userTechnician.set(false);
  }

  registry(user: User): { success: boolean, message?: string } {

    const users = this.getStoredUsers();

    const userExists = users.some((u: User) => u.username.toLowerCase() === user.username.toLowerCase());
    const emailExists = users.some((u: User) => u.email.toLowerCase() === user.email.toLowerCase());
  
    if (userExists) {
      return { success: false, message: `El nombre de usuario ${user.username} ya está en uso.` };
    }
  
    if (emailExists) {
      return { success: false, message: `El correo electrónico ${user.email} ya está en uso.` };
    }
    users.push(user);

    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser',JSON.stringify(user))
    
    this.isLogged.set(true);
    return {success:true};
  }

  currentUserExists():boolean{
    return !!this.getCurrentUser();
  }

  isTechnician(): boolean {
    const user = this.getCurrentUser()
    if(user){
      return (user.role === 'technician');
    }
    return false
  }

  getCurrentUser(): User | null {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      return JSON.parse(userJson) as User;
    }
    return null;
  }


  
  updateUser(updatedUser: User, originalUsername: string, originalEmail: string): { success: boolean, message?: string } {
    const users = this.getStoredUsers();
  
    
    const isDuplicate = users.some((u: User) =>
      (u.username.toLowerCase() === updatedUser.username.toLowerCase() || u.email.toLowerCase() === updatedUser.email.toLowerCase()) &&
      (u.username.toLowerCase() !== originalUsername.toLowerCase() || u.email.toLowerCase() !== originalEmail.toLowerCase())
    );
  
    if (isDuplicate) {
      return { success: false, message: 'Ya existe un usuario con ese nombre de usuario o correo electrónico.' };
    }
  
    // Buscar al usuario original
    const userIndex = users.findIndex(
      (u: User) => u.username === originalUsername && u.email.toLowerCase() === originalEmail.toLowerCase()
    );
  
    if (userIndex === -1) {
      return { success: false, message: 'Usuario original no encontrado.' };
    }
  
    // Actualizar los datos
    users[userIndex] = updatedUser;
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  
    return {success: true};
  }
  
  
  
}
