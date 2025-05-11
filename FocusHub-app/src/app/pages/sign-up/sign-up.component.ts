import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { User } from '../../shared/interfaces/user.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sign-up',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent {

  router = inject(Router);
  fb = inject(FormBuilder);
  authService = inject(AuthService);

  passwordsMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const rePassword = control.get('rePassword')?.value;
    return password === rePassword ? null : { passwordsMismatch: true };
  };

  signUpForm = this.fb.group({
    fullname: ['', [Validators.required]],
    username: ['', [Validators.required]],
    email: ['', [Validators.email, Validators.required]],
    password: ['', [Validators.required]],
    rePassword: ['', [Validators.required]],
    company:['IronFix'],
    phone:[''],
    role: ['admin']
  }, { validators: this.passwordsMatchValidator });

  onRegistry() {

    if (this.signUpForm.invalid) {

      const usernameControl = this.signUpForm.get('username');
      const emailControl = this.signUpForm.get('email');
      const passwordControl = this.signUpForm.get('password');
      const rePasswordControl = this.signUpForm.get('rePassword');
      const fullnameControl = this.signUpForm.get('fullname');


      if (usernameControl?.hasError('required') || fullnameControl?.hasError('required') || emailControl?.hasError('required') || passwordControl?.hasError('required') || rePasswordControl?.hasError('required')) {
        Swal.fire({
          text: 'Debe diligenciar todos los campos',
          icon: 'error'
        });
        return;
      }
      if (emailControl?.hasError('email')) {
        Swal.fire({
          text: 'Por favor ingresa un correo electrónico válido.',
          icon: 'error'
        });
        return;
      }
      if (this.signUpForm.hasError('passwordsMismatch')) {
        Swal.fire({
          text: 'Las contraseñas no coinciden',
          icon: 'error'
        });
        return;
      }
      
      Swal.fire({
        text: 'Formulario inválido',
        icon: 'error'
      });
      return;
    }
    
    const {rePassword,...userRegistry} = this.signUpForm.getRawValue();
    
    const result = this.authService.registry(userRegistry as User);

    if (result.success) {
      this.signUpForm.reset();
      Swal.fire({
        title: "Registro",
        text: "Usuario Registrado con Exito",
        icon: "success"
      });
      this.router.navigateByUrl('');
    }else{
      Swal.fire({
        title: "Error de registro",
        text: result.message,
        icon: "error"
      });
    }
  }
}
