// src/app/shared/interfaces/task-reminder.interface.ts
import { Task } from './task.interface'; // Assuming Task interface is in the same folder

export interface TaskReminder {
  id: number;
  reminderTime: Date; // Use Date here as Angular's Date pipe and new Date() handle it
  notificationType: 'push' | 'desktop';
  status: number;
  // If your backend entity includes the 'task' object when fetching a reminder,
  // then include it here. Otherwise, you might only get the 'taskId'.
  task?: Task; // Optional, as it might not always be fully loaded/needed
  taskId: number; // This directly corresponds to the task_id foreign key in the DB
}