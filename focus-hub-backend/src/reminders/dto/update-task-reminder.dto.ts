// src/task-reminders/dto/update-task-reminder.dto.ts
import { PartialType } from '@nestjs/mapped-types'; // Or from '@nestjs/swagger' if you use that
import { CreateTaskReminderDto } from './create-task-reminder.dto';
import { IsDateString, IsEnum, IsOptional, IsNumber } from 'class-validator';

// PartialType makes all fields optional, which is common for updates
export class UpdateTaskReminderDto extends PartialType(CreateTaskReminderDto) {
  // You might want to override some fields if their validation or type needs to change for update
  // For example, if 'reminderTime' could be optional in an update
  @IsOptional()
  @IsDateString()
  reminderTime?: string; // It's optional for update

  @IsOptional()
  @IsEnum(['push', 'desktop'])
  notificationType?: 'push' | 'desktop';

  @IsOptional()
  @IsNumber()
  status?: number;

  // IMPORTANT: taskId from CreateTaskReminderDto is implicitly optional due to PartialType.
  // If you *never* want to allow taskId to be updated, you can explicitly remove it here.
  // However, since it's not being used in the service update method anyway, it's fine.
}