// Example: src/task-reminders/dto/create-task-reminder.dto.ts
import { IsNumber, IsDateString, IsEnum } from 'class-validator';

export class CreateTaskReminderDto {
  @IsNumber()
  taskId: number; // This should be present

  @IsDateString()
  reminderTime: string; // Or Date, depending on how you handle it

  @IsEnum(['push', 'desktop'])
  notificationType: 'push' | 'desktop';
}