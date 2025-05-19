// src/users/users.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete,UseGuards, Request  } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')  // Ruta base para este controlador
export class UsersController {
  constructor(private readonly usersService: UsersService) {}


  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Request() req) {
    return req.user;
  }
  // Ruta para crear un nuevo usuario
  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    // Asignar valores por defecto si no vienen
    if (!createUserDto.themePreference) {
      createUserDto.themePreference = 'light';
    }
    if (createUserDto.soundEnabled === undefined) {
      createUserDto.soundEnabled = true;
    }
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
