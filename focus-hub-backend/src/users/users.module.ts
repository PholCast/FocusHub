import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';  // Importar la entidad User
import { AmbientSound } from '../media/ambient-sound.entity';  // Importar la entidad AmbientSound
import { Category } from 'src/categories/category.entity';  // Importar la entidad Category
import { Event } from '../events/event.entity';  // Importar la entidad Event
import { Technique } from 'src/productivity/entities/technique.entity';  // Importar la entidad Technique
import { FocusSession } from 'src/productivity/entities/focus-session.entity';  // Importar la entidad FocusSession
import { Task } from 'src/tasks/task.entity';  // Importar la entidad Task
import { MediaModule } from '../media/media.module';  // Importar el módulo MediaModule
import { CategoriesModule } from 'src/categories/categories.module';  // Importar el módulo CategoriesModule
import { EventsModule } from 'src/events/events.module';  // Importar el módulo EventsModule
import { ProductivityModule } from 'src/productivity/productivity.module';  // Importar el módulo ProductivityModule
import { TasksModule } from 'src/tasks/tasks.module';  // Importar el módulo TasksModule
import { MediaService } from 'src/media/media.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),MediaModule  // Registrar las entidades  // Importar el módulo MediaModule
  ],
  controllers: [UsersController],
  providers: [UsersService,MediaService],
  exports: [UsersService],  // Si el servicio es necesario en otros módulos
})
export class UsersModule {}