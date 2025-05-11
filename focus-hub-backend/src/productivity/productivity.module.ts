import { Module } from '@nestjs/common';
import { ProductivityService } from './productivity.service';
import { ProductivityController } from './productivity.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FocusSession } from './entities/focus-session.entity';
import { Technique } from './entities/technique.entity';
import { FocusSessionTask } from './entities/focus-session-task.entity';
import { Task } from 'src/tasks/task.entity';
import { User } from 'src/users/user.entity';
import { UsersModule } from 'src/users/users.module';
import { TasksModule } from 'src/tasks/tasks.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([FocusSessionTask,FocusSession, Technique]),
    UsersModule,
    TasksModule,],
  providers: [ProductivityService],
  controllers: [ProductivityController],
  exports: [ProductivityService],
})
export class ProductivityModule {}
