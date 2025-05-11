import { Module,forwardRef } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { User } from '../users/user.entity'; // Importar la entidad de User
import { Category } from '../categories/category.entity'; // Importar la entidad de Category
import { FocusSessionTask } from 'src/productivity/entities/focus-session-task.entity'; // Importar FocusSessionTask
import { TaskReminder } from 'src/reminders/entities/task-reminder.entity'; // Importar TaskReminder
import { UsersModule } from 'src/users/users.module'; // Importar UsersModule
import { CategoriesModule } from 'src/categories/categories.module'; // Importar CategoriesModule
import { RemindersModule } from 'src/reminders/reminders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]), // Importar las entidades
    UsersModule, // Importar UsersModule
    CategoriesModule,
    forwardRef(() => RemindersModule)
  ],
  providers: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}
