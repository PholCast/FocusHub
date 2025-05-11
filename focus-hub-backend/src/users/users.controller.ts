// src/users/users.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')  // Ruta base para este controlador
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Ruta para crear un nuevo usuario
  @Post()
  createUser(
    @Body() createUserDto: { email: string; password: string; name: string; lastname?: string }
  ) {
    return this.usersService.createUser(createUserDto);
  }

  // Ruta para obtener todos los usuarios
  @Get()
  getUsers() {
    return this.usersService.getUsers();
  }

  // Ruta para obtener un usuario por ID
  @Get(':id')
  getUserById(@Param('id') id: number) {
    return this.usersService.getUserById(id);
  }

  // Ruta para actualizar un usuario
  @Put(':id')
  updateUser(
    @Param('id') id: number,
    @Body() updateUserDto: { email?: string; password?: string; name?: string; lastname?: string }
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  // Ruta para eliminar un usuario
  @Delete(':id')
  deleteUser(@Param('id') id: number) {
    return this.usersService.deleteUser(id);
  }
}
