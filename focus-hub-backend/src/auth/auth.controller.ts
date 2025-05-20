
import { Body, Controller, Post, UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    try {
      return await this.authService.login(body.email, body.password);
    } catch (error) {
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  @Post('register')
  async register(@Body() body: { email: string; password: string; name: string; lastname?: string }) {
    try {
      return await this.authService.register(body);
    } catch (error) {
      if (error.message === 'Email already registered') {
        throw new ConflictException('Este correo electrónico ya está registrado');
      }
      throw error;
    }
  }
}
