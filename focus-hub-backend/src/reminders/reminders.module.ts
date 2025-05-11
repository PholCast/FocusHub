import { Module, forwardRef } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventReminder } from './entities/event-reminder.entity';
import { TaskReminder } from './entities/task-reminder.entity';
import { Event } from '../events/event.entity'; // Correcto
import { Task } from '../tasks/task.entity';
import { EventsModule } from '../events/events.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventReminder, TaskReminder]),
    forwardRef(() => EventsModule),
    forwardRef(() => TasksModule),
  ],
  providers: [RemindersService],
  controllers: [RemindersController],
  exports: [RemindersService],
})
export class RemindersModule {}
