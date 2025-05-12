import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-log-in',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.css']
})
export class LogInComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  
  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  onLogin(): void {
    if (this.loginForm.invalid) {
      Swal.fire({
        title: "Error",
        text: "Por favor complete todos los campos correctamente.",
        icon: "error",
        confirmButtonText: "Aceptar"
      });
      return;
    }

    const credentials = this.loginForm.getRawValue();
    this.authService.logIn(credentials)!;
  }
}
