import { Module, forwardRef } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Category } from 'src/categories/category.entity';
import { EventReminder } from 'src/reminders/entities/event-reminder.entity';
import { UsersModule } from 'src/users/users.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { RemindersModule } from 'src/reminders/reminders.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event]),CategoriesModule,UsersModule,forwardRef(() => RemindersModule)],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService],
})
export class EventsModule {}
