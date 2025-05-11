import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-log-in',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './log-in.component.html',
  styleUrl: './log-in.component.css'
})
export class LogInComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  // Form definition with validation rules
  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      await Swal.fire({
        title: "Error",
        text: "Por favor complete todos los campos correctamente",
        icon: "error",
        color: "#716add",
        backdrop: `rgba(0,0,123,0.4) left top no-repeat`
      });
      return;
    }

    const credentials = {
      email: this.loginForm.value.email!,
      password: this.loginForm.value.password!
    };

    const success = this.authService.logIn(credentials);
    
    if (success) {
      await Swal.fire({
        title: "Éxito",
        text: "Inicio de sesión exitoso!",
        icon: "success",
        color: "#716add",
        backdrop: `rgba(0,0,123,0.4) left top no-repeat`
      });
      this.router.navigate(['/home']);
    } else {
      const user = this.authService.users.find(u => u.email === credentials.email);
      if (!user) {
        await Swal.fire({
          title: "Error",
          text: "Usuario no encontrado",
          icon: "error",
          color: "#716add",
          backdrop: `rgba(0,0,123,0.4) left top no-repeat`
        });
      } else {
        await Swal.fire({
          title: "Error",
          text: "Contraseña incorrecta",
          icon: "error",
          color: "#716add",
          backdrop: `rgba(0,0,123,0.4) left top no-repeat`
        });
      }
    }
  }
}