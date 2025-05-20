
import { Controller, Get, Post, Body, Param, Put, Delete,UseGuards, Request  } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}


  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Request() req) {
    return req.user;
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {

    if (!createUserDto.themePreference) {
      createUserDto.themePreference = 'light';
    }
    if (createUserDto.soundEnabled === undefined) {
      createUserDto.soundEnabled = true;
    }
    return this.usersService.createUser(createUserDto);
  }


  @Get()
  getUsers() {
    return this.usersService.getUsers();
  }


  @Get(':id')
  getUserById(@Param('id') id: number) {
    return this.usersService.getUserById(id);
  }


  @Put(':id')
  updateUser(
    @Param('id') id: number,
    @Body() updateUserDto: { email?: string; password?: string; name?: string; lastname?: string }
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }


  @Delete(':id')
  deleteUser(@Param('id') id: number) {
    return this.usersService.deleteUser(id);
  }
}
