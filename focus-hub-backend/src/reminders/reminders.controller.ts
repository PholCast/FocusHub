// reminders.controller.ts
import { Controller, Post, Body, UseGuards, Get, Param, NotFoundException, Patch, HttpCode, Delete } from '@nestjs/common'; // Import Get, Param, NotFoundException
import { RemindersService } from './reminders.service';
import { AuthGuard } from '@nestjs/passport';
import { TaskReminder } from './entities/task-reminder.entity';
import { EventReminder } from './entities/event-reminder.entity'; // NEW: Import EventReminder
import { CreateTaskReminderDto } from './dto/create-task-reminder.dto'; // Import the DTO
import { UpdateTaskReminderDto } from './dto/update-task-reminder.dto'; // Import the DTO
import { CreateEventReminderDto } from './dto/create-event-reminder.dto'; // NEW: Import DTO
import { UpdateEventReminderDto } from './dto/update-event-reminder.dto'; // NEW: Import DTO

@Controller('reminders')
@UseGuards(AuthGuard('jwt'))
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post('task')
  createTaskReminder(@Body() createDto: CreateTaskReminderDto) { // CHANGED
    return this.remindersService.createTaskReminder(createDto);
  }

  @Patch(':id/status')
  updateReminderStatus(@Param('id') id: number, @Body('status') status: number) {
    return this.remindersService.updateReminderStatus(id, status);
  }

  @Patch(':id')
  updateReminder(@Param('id') id: number, @Body() updateDto: UpdateTaskReminderDto) {
    console.log('Backend Controller: PATCH /reminders/:id hit. ID:', id); // <-- AÑADIR ESTE LOG
    return this.remindersService.updateReminder(id, updateDto);
  }


  // --- NEW ENDPOINT ADDED HERE ---
  @Get('task/:taskId') // Define a GET endpoint with a parameter
  async getTaskReminder(@Param('taskId') taskId: number): Promise<TaskReminder> {
    const reminder = await this.remindersService.getTaskReminderByTaskId(taskId);
    if (!reminder) {
      // If no reminder is found, throw a NotFoundException
      throw new NotFoundException(`Reminder for task with ID ${taskId} not found.`);
    }
    return reminder;
  }

  // --- NEW: Event Reminders Endpoints ---
  @Post('event')
  createEventReminder(@Body() createDto: CreateEventReminderDto) {
    return this.remindersService.createEventReminder(createDto);
  }

  @Get('event/:eventId')
  async getEventReminder(@Param('eventId') eventId: number): Promise<EventReminder> {
    const reminder = await this.remindersService.getEventReminderByEventId(eventId);
    if (!reminder) {
      throw new NotFoundException(`Reminder for event with ID ${eventId} not found.`);
    }
    return reminder;
  }

  @Patch('event/:id') // Specific for updating EventReminder by its ID
  updateEventReminder(@Param('id') id: number, @Body() updateDto: UpdateEventReminderDto) {
    return this.remindersService.updateEventReminder(id, updateDto);
  }

  @Patch('event/:id/status') // Specific for updating EventReminder status
  updateEventReminderStatus(@Param('id') id: number, @Body('status') status: boolean) {
    return this.remindersService.updateEventReminderStatus(id, status);
  }

  @Delete('event/:id') // Specific for deleting EventReminder
  @HttpCode(204)
  async deleteEventReminder(@Param('id') id: number): Promise<void> {
    await this.remindersService.deleteEventReminder(id);
  }
}