import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { AmbientSound } from '../ambient-sound/ambient-sound.entity';
import { Category } from 'src/categories/category.entity';
import { Event } from '../events/event.entity';
import { Technique } from 'src/productivity/entities/technique.entity';
import { FocusSession } from 'src/productivity/entities/focus-session.entity';
import { Task } from 'src/tasks/task.entity';
import { AmbientSoundModule } from '../ambient-sound/ambient-sound.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { EventsModule } from 'src/events/events.module';
import { ProductivityModule } from 'src/productivity/productivity.module';
import { TasksModule } from 'src/tasks/tasks.module';
import { AmbientSoundService } from 'src/ambient-sound/ambient-sound.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),AmbientSoundModule
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}