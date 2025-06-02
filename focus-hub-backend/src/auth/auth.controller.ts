
import { Body, Controller, Post, UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-request.dto';
import { SignUpDto } from './dto/sign-up-request.dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto:LoginDto) {
    try {
      return await this.authService.login(loginDto.email, loginDto.password);
    } catch (error) {
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  @Post('register')
  async register(@Body() signUpDto:SignUpDto) {
    try {
      return await this.authService.register(signUpDto);
    } catch (error) {
      if (error.message === 'Email already registered') {
        throw new ConflictException('Este correo electrónico ya está registrado');
      }
      throw error;
    }
  }
}