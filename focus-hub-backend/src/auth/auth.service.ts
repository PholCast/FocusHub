
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import { MyLogger } from '../logger.service';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly logger: MyLogger,
    private readonly jwtService: JwtService


  ) { }

  async register(userData: { email: string; password: string; name: string; lastname?: string }): Promise<User> {
    const existingUser = await this.usersRepository.findOne({ where: { email: userData.email } });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);


    const newUser = this.usersRepository.create({
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      lastname: userData.lastname,
      themePreference: 'light',
      soundEnabled: true,



    });

    this.logger.log(`Creating user...${newUser.email} - ${newUser.name}`);
    return this.usersRepository.save(newUser);
  }


  async login(email: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };


    this.logger.log(`User logged in...${user.email} - ${user.name}`);
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastname: user.lastname,
      }
    }
  }
}