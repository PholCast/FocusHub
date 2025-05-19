// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }
  
  async createUser(createUserDto: CreateUserDto) {
  const user = this.userRepository.create(createUserDto);
  return await this.userRepository.save(user);
}


  // Obtener todos los usuarios
  async getUsers() {
    return await this.userRepository.find(); // Recupera todos los usuarios
  }

  // Obtener un usuario por ID
  async getUserById(id: number) {
    return await this.userRepository.findOne({ where: { id } }); // Recupera un usuario por ID
  }

  // Actualizar un usuario por ID
  async updateUser(id: number, updateUserDto: Partial<User>) {
    await this.userRepository.update(id, updateUserDto);
    return this.getUserById(id); // Retorna el usuario actualizado
  }

  // Eliminar un usuario por ID
  async deleteUser(id: number) {
    const user = await this.getUserById(id);
    if (user) {
      await this.userRepository.delete(id); // Elimina el usuario de la base de datos
      return user; // Retorna el usuario eliminado
    }
    return null;
  }
}
