// src/task-reminders/dto/update-event-reminder.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateEventReminderDto } from './create-event-reminder.dto';
import { IsBoolean, IsDateString, IsEnum, IsOptional } from 'class-validator';

export class UpdateEventReminderDto extends PartialType(CreateEventReminderDto) {
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}