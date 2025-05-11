// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Crear un nuevo usuario
  async createUser(createUserDto: { email: string; password: string; name: string; lastname?: string }) {
    const user = this.userRepository.create(createUserDto); // Crear un nuevo objeto de usuario
    return await this.userRepository.save(user); // Guardar el usuario en la base de datos
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
