import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  // Registration form with validation rules
  registryForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    repeatPassword: ['', [Validators.required]]
  });

  async onRegistry(): Promise<void> {
    if (this.registryForm.invalid) {
      await Swal.fire({
        title: "Error",
        text: "Por favor complete todos los campos correctamente",
        icon: "error",
        color: "#716add",
        backdrop: `rgba(0,0,123,0.4) left top no-repeat`
      });
      return;
    }

    const { username, email, password, repeatPassword } = this.registryForm.getRawValue();

    if (password !== repeatPassword) {
      await Swal.fire({
        title: "Error",
        text: "Las contraseñas no coinciden",
        icon: "error",
        color: "#716add",
        backdrop: `rgba(0,0,123,0.4) left top no-repeat`
      });
      return;
    }

    const success = this.authService.signUp({ username, email, password });
    
    if (success) {
      await Swal.fire({
        title: "Éxito",
        text: "Registro exitoso! Redirigiendo...",
        icon: "success",
        color: "#716add",
        backdrop: `rgba(0,0,123,0.4) left top no-repeat`
      });
      this.router.navigate(['/log-in']);
    } else {
      const users = this.authService.users;
      if (users.some(user => user.email === email)) {
        await Swal.fire({
          title: "Error",
          text: "Este correo electrónico ya está registrado",
          icon: "error",
          color: "#716add",
          backdrop: `rgba(0,0,123,0.4) left top no-repeat`
        });
      } else {
        await Swal.fire({
          title: "Error",
          text: "Error en el registro. Por favor intente nuevamente.",
          icon: "error",
          color: "#716add",
          backdrop: `rgba(0,0,123,0.4) left top no-repeat`
        });
      }
    }
  }
}