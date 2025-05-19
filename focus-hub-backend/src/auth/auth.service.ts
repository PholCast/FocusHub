// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity'; // Asumo que tienes una entidad User aquí
import * as bcrypt from 'bcrypt'; // Asegúrate de tener bcrypt instalado (npm install bcryptjs o bcrypt)
import { MyLogger } from '../logger.service';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly logger: MyLogger,
    private readonly jwtService: JwtService
    // Si vas a buscar un AmbientSound por defecto al crear el usuario,
    // deberías inyectar el repositorio de AmbientSound aquí:
    // @InjectRepository(AmbientSound)
    // private ambientSoundRepository: Repository<AmbientSound>,
  ) {}

  async register(userData: { email: string; password: string; name: string; lastname?: string }): Promise<User> {
    const existingUser = await this.usersRepository.findOne({ where: { email: userData.email } });
    if (existingUser) {
      throw new Error('Email already registered'); // Considera usar un ConflictException de NestJS
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Si 'soundPreference' es opcional en el registro inicial (ya que es nullable: true en tu entidad),
    // simplemente puedes OMITIRLO del objeto que pasas a .create() si el usuario no lo proporciona.
    // TypeORM lo establecerá en NULL en la base de datos, si la columna lo permite.

    const newUser = this.usersRepository.create({
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      lastname: userData.lastname,
      themePreference: 'light', // Puedes mantener estos valores por defecto si es necesario
      soundEnabled: true,       // Omitirlos si tu entidad tiene valores por defecto para ellos
                                // y prefieres que TypeORM los aplique.

      // ¡IMPORTANTE!: Elimina cualquier línea que intente asignar 'sound_preference'
      // como si fuera una propiedad del objeto.
      // La propiedad en la entidad es 'soundPreference' (que espera un objeto AmbientSound).
      // Si quieres asignar un sonido ambiental por defecto:
      // Primero, debes obtener la entidad AmbientSound correspondiente.
      // Por ejemplo, si tienes un sonido ambiental con ID 1 que quieres sea el predeterminado:
      // soundPreference: await this.ambientSoundRepository.findOne({ where: { id: 1 } }),
      // (Recuerda inyectar el repositorio de AmbientSound y asegurar que tu AuthModule lo importe)
    });

    // Si no estás proporcionando un valor para soundPreference en el registro,
    // y la columna `sound_preference` en la BASE DE DATOS es NOT NULL,
    // aún podrías tener un error de base de datos si no tiene un DEFAULT.
    // Si ese es el caso, deberás implementar la lógica para asignar un valor por defecto (como en el comentario anterior).
    this.logger.log(`Creating user...${newUser.email} - ${newUser.name}`);
    return this.usersRepository.save(newUser);
  }


  // ... tu método login ...
  async login(email: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new Error('User not found'); // Este error es capturado por el controller y se convierte en 401
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials'); // Este error es capturado por el controller y se convierte en 401
    }

    const payload = { email: user.email, sub: user.id };
    // return {
    //   access_token: this.jwtService.sign(payload),
    //   user: { id: user.id, email: user.email, name: user.name } // Devuelve la info del usuario que necesites
    // };
    this.logger.log(`User logged in...${user.email} - ${user.name}`);
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastname: user.lastname,// Placeholder
        }
    }
  }
}