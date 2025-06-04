// src/task-reminders/reminders.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskReminder } from './entities/task-reminder.entity'; // Your entity
import { EventReminder } from './entities/event-reminder.entity'; // NEW: Import EventReminder
import { CreateTaskReminderDto } from './dto/create-task-reminder.dto';
import { UpdateTaskReminderDto } from './dto/update-task-reminder.dto';
import { CreateEventReminderDto } from './dto/create-event-reminder.dto'; // NEW: Import DTO
import { UpdateEventReminderDto } from './dto/update-event-reminder.dto';

import { Task } from '../tasks/task.entity'; // Make sure path is correct
import { Event } from '../events/event.entity'; // NEW: Import Event
@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(TaskReminder)
    private taskReminderRepository: Repository<TaskReminder>,
    @InjectRepository(EventReminder) // NEW: Inject EventReminder repository
    private eventReminderRepository: Repository<EventReminder>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Event) // NEW: Inject Event repository
    private eventRepository: Repository<Event>,
  ) {}

  async createTaskReminder(createDto: CreateTaskReminderDto): Promise<TaskReminder> {
    try {
      const task = await this.taskRepository.findOne({ where: { id: createDto.taskId } });
      if (!task) {
        throw new NotFoundException(`Task with ID ${createDto.taskId} not found.`);
      }

      const reminder = this.taskReminderRepository.create({
        reminderTime: new Date(createDto.reminderTime),
        notificationType: createDto.notificationType,
        status: 1, // Default status
        task: task, // Set the relation object for the 'task_id' foreign key
        taskId: createDto.taskId, // <-- This was the crucial addition
      });

      return await this.taskReminderRepository.save(reminder);
    } catch (error) {
      console.error('Error creating task reminder:', error);
      throw error;
    }
  }
  async getTaskReminderByTaskId(taskId: number): Promise<TaskReminder> {
    const reminder = await this.taskReminderRepository.findOne({
      where: { task: { id: taskId } }, // Query by the relation's ID (task_id column)
      // If you need task details in the frontend, uncomment the line below:
      // relations: ['task'],
    });
    if (!reminder) {
      throw new NotFoundException(`Reminder for task with ID ${taskId} not found.`);
    }
    return reminder;
  }

  async updateReminder(id: number, updateDto: UpdateTaskReminderDto): Promise<TaskReminder> {
    console.log('Backend Service: updateReminder called for ID:', id); 
    const reminder = await this.taskReminderRepository.findOne({ where: { id } });
    if (!reminder) {
      console.error(`Backend Service: Reminder with ID ${id} NOT FOUND in database.`);
      throw new NotFoundException(`Reminder with ID ${id} not found.`);
    }

    if (updateDto.reminderTime) {
      reminder.reminderTime = new Date(updateDto.reminderTime);
    }
    if (updateDto.notificationType) {
      reminder.notificationType = updateDto.notificationType;
    }
    if (updateDto.status !== undefined) {
      reminder.status = updateDto.status;
    }
    // No need to update taskId here unless the task it's related to changes,
    // which is unlikely for a reminder.

    return this.taskReminderRepository.save(reminder);
  }

  async updateReminderStatus(id: number, status: number): Promise<TaskReminder> {
    const reminder = await this.taskReminderRepository.findOne({ where: { id } });
    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found.`);
    }
    reminder.status = status;
    return this.taskReminderRepository.save(reminder);
  }

  async deleteReminder(id: number): Promise<void> {
    const result = await this.taskReminderRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Reminder with ID ${id} not found.`);
    }
  }

   // --- NEW: Event Reminders Methods ---
  async createEventReminder(createDto: CreateEventReminderDto): Promise<EventReminder> {
    try {
      const event = await this.eventRepository.findOne({ where: { id: createDto.eventId } });
      if (!event) {
        throw new NotFoundException(`Event with ID ${createDto.eventId} not found.`);
      }

      const reminder = this.eventReminderRepository.create({
        reminderTime: new Date(createDto.reminderTime),
        notificationType: createDto.notificationType,
        status: true, // Default status: true (active/pending)
        event: event,
      });

      return await this.eventReminderRepository.save(reminder);
    } catch (error) {
      console.error('Error creating event reminder:', error);
      throw error;
    }
  }

  async getEventReminderByEventId(eventId: number): Promise<EventReminder> {
    const reminder = await this.eventReminderRepository.findOne({
      where: { event: { id: eventId } },
    });
    if (!reminder) {
      throw new NotFoundException(`Reminder for event with ID ${eventId} not found.`);
    }
    return reminder;
  }

  async updateEventReminder(id: number, updateDto: UpdateEventReminderDto): Promise<EventReminder> {
    const reminder = await this.eventReminderRepository.findOne({ where: { id } });
    if (!reminder) {
      throw new NotFoundException(`Event Reminder with ID ${id} not found.`);
    }

    if (updateDto.reminderTime) {
      reminder.reminderTime = new Date(updateDto.reminderTime);
    }
    if (updateDto.notificationType) {
      reminder.notificationType = updateDto.notificationType;
    }
    if (updateDto.status !== undefined) {
      reminder.status = updateDto.status;
    }

    return this.eventReminderRepository.save(reminder);
  }

  async updateEventReminderStatus(id: number, status: boolean): Promise<EventReminder> {
    const reminder = await this.eventReminderRepository.findOne({ where: { id } });
    if (!reminder) {
      throw new NotFoundException(`Event Reminder with ID ${id} not found.`);
    }
    reminder.status = status;
    return this.eventReminderRepository.save(reminder);
  }

  async deleteEventReminder(id: number): Promise<void> {
    const result = await this.eventReminderRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Event Reminder with ID ${id} not found.`);
    }
  }
}