export class CreateUserDto {
  name: string;
  email: string;
  password: string;
  lastname?: string;
  themePreference?: 'light' | 'dark';
  soundEnabled?: boolean;
}
