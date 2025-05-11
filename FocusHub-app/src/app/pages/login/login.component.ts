import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  router = inject(Router);

  authService = inject(AuthService);

  fb = inject(FormBuilder);

  loginForm = this.fb.group({
    role:['',Validators.required],
    usernameOrEmail:['', [Validators.required]],
    password:['', [Validators.required]]
  })



  onLogin(){
    if(this.loginForm.invalid){
      Swal.fire({
        text:'Diligencie todos los campos',
        icon:'error'
      })
      return;
    }
    
    const {usernameOrEmail, password, role} = this.loginForm.value;

    const success = this.authService.login(usernameOrEmail!, password!,role!);

    if (!success){
      Swal.fire({
        text: 'Credenciales incorrectas',
        icon: 'error'
      });
      return
      
    }
    this.router.navigateByUrl('');

  }

}
