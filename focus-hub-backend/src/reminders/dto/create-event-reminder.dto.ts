// src/task-reminders/dto/create-event-reminder.dto.ts
import { IsDateString, IsEnum, IsNumber } from 'class-validator';

export class CreateEventReminderDto {
  @IsNumber()
  eventId: number; // This will map to the 'event' relation
  @IsDateString()
  reminderTime: string;
  @IsEnum(['push', 'desktop'])
  notificationType: 'push' | 'desktop';
}