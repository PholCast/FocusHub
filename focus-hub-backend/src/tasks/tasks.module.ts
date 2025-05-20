import { Module,forwardRef } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';
import { FocusSessionTask } from 'src/productivity/entities/focus-session-task.entity';
import { TaskReminder } from 'src/reminders/entities/task-reminder.entity';
import { UsersModule } from 'src/users/users.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { RemindersModule } from 'src/reminders/reminders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task,User,Category]),
    UsersModule,
    CategoriesModule,
    forwardRef(() => RemindersModule)
  ],
  providers: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}
