import { Component, OnInit, Signal, computed, signal } from '@angular/core';
import { Task } from '../../shared/interfaces/task.interface';
import { TaskService } from '../../services/task.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavComponent } from '../../shared/components/nav/nav.component';
import { ReminderService } from '../../services/reminder.service';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [NavComponent, CommonModule, FormsModule],
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css']
})
export class TaskComponent implements OnInit {

  selectedTask: Task | null = null;
  showCompleted = false;
  showExpired = false;

  newCategory = '';
  categories: string[] = [];
  newProject = '';
  projects: string[] = [];

  constructor(public taskService: TaskService, private reminderService: ReminderService) {}

  ngOnInit(): void {
    this.taskService.loadTasks(); // carga inicial
    this.categories = this.taskService.getCategories();
    this.projects = this.taskService.getProjects();
  }

  addTask(title: string): void {
    if (title.trim()) {
      const newTask = {
        title: title.trim(),
        description: '',
        dueDate: undefined,
        category: '',
        project: '',
        user_id: null
      };
      this.taskService.addTask(newTask).subscribe(); 
    }
  }

  toggleComplete(id: number): void {
    // Accede a la tarea de la señal base del servicio
    const task = this.taskService.tasks().find(t => t.id === id);
    if (!task) return;

    this.taskService.toggleComplete(task).subscribe({
      next: (updatedTask) => {
        if (this.selectedTask?.id === id) {
          this.selectedTask = { ...updatedTask };
        }
      },
      error: (err) => console.error('Error al cambiar el estado de la tarea:', err)
    });
  }

  deleteTask(id: number): void {
    this.taskService.deleteTask(id).subscribe({
      next: () => {
        if (this.selectedTask?.id === id) {
          this.selectedTask = null;
        }
      },
      error: (err) => console.error('Error al eliminar tarea:', err)
    });
  }

  openTaskDetails(task: Task): void {
    this.selectedTask = { ...task };
    this.selectedTask.reminderDaysBefore = undefined;

    this.reminderService.getReminderForTask(task.id).subscribe({
      next: (reminder) => {
        if (reminder && this.selectedTask) {
          const reminderDate = new Date(reminder.reminderTime);
          const dueDate = task.dueDate ? new Date(task.dueDate) : null;
          if (dueDate) {
            const diffTime = dueDate.getTime() - reminderDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            this.selectedTask.reminderDaysBefore = diffDays;
          }
        }
      },
      error: (err) => {
        console.error('Error al obtener recordatorio:', err);
        this.selectedTask!.reminderDaysBefore = undefined;
      }
    });
  }

  closeDetails(): void {
    this.selectedTask = null;
  }

  saveTaskDetails(): void {
    if (this.selectedTask && this.selectedTask.id && this.selectedTask.status !== 'completed') {
      if (this.selectedTask.dueDate) {
          this.selectedTask.dueDate = new Date(this.selectedTask.dueDate).toISOString().split('T')[0];
      }

      this.taskService.updateTask(this.selectedTask).subscribe({
        next: (updatedTask) => {
          console.log('Tarea actualizada con éxito:', updatedTask);
          this.closeDetails();
        },
        error: (err) => console.error('Error al guardar detalles de la tarea:', err)
      });
    } else if (this.selectedTask?.status === 'completed') {
      alert('No puedes editar una tarea completada. Desmárcala como completada primero.');
    }
  }

  duplicateTask(id: number): void {
    const task = this.taskService.tasks().find(t => t.id === id); // Accede a la tarea desde la señal del servicio
    if (!task) return;

    this.taskService.duplicateTask(task).subscribe({
      next: () => {
        this.closeDetails();
      },
      error: (err) => console.error('Error al duplicar tarea:', err)
    });
  }

  confirmDelete(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      this.deleteTask(id);
    }
  }

  addCategory(): void {
    if (this.newCategory.trim()) {
      this.taskService.addCategory(this.newCategory.trim());
      this.categories = this.taskService.getCategories();
      this.newCategory = '';
    }
  }

  addProject(): void {
    if (this.newProject.trim()) {
      this.taskService.addProject(this.newProject.trim());
      this.projects = this.taskService.getProjects();
      this.newProject = '';
    }
  }

  updateTaskReminder(): void {
    if (!this.selectedTask || !this.selectedTask.dueDate) { 
      console.warn('Cannot set reminder: Task or Due Date is missing.');
      return;
    }

    const daysBefore = this.selectedTask.reminderDaysBefore;
    // --- NEW LOGIC: Calculate the actual reminderDate to send to the backend ---
    const actualReminderDate = this.calculateReminderDate(this.selectedTask.dueDate, daysBefore);

    if (daysBefore !== undefined && daysBefore !== null && actualReminderDate) {
      this.reminderService.getReminderForTask(this.selectedTask.id).subscribe({
        next: (existingReminder) => {
          if (existingReminder) {
            console.log('Frontend: Found existing reminder with ID:', existingReminder.id); // <-- AÑADIR ESTE LOG
            // Pass the calculated actualReminderDate to updateReminder
            this.reminderService.updateReminder(existingReminder.id, actualReminderDate).subscribe({ // CHANGED
              next: response => console.log('Recordatorio actualizado:', response),
              error: error => console.error('Error al actualizar recordatorio:', error)
            });
          } else {
            console.log('Frontend: No existing reminder found. Creating new one.'); // <-- AÑADIR ESTE LOG
            // Pass the calculated actualReminderDate to createReminder
            this.reminderService.createReminder(this.selectedTask!.id, actualReminderDate).subscribe({ // CHANGED
              next: response => console.log('Recordatorio creado:', response),
              error: error => console.error('Error al crear recordatorio:', error)
            });
          }
        },
        error: (err) => {
          // If GET fails (e.g., 404 for no existing reminder), then create it.
          console.warn('No existing reminder found or GET error. Attempting to create new reminder.', err);
          this.reminderService.createReminder(this.selectedTask!.id, actualReminderDate).subscribe({ // CHANGED
            next: response => console.log('Recordatorio creado tras GET error:', response),
            error: error => console.error('Error al crear recordatorio tras GET error:', error)
          });
        }
      });
    } else {
      // If reminderDaysBefore is undefined/null, it means user selected "Sin recordatorio" or cleared it.
      // In this case, we should attempt to delete any existing reminder.
      this.reminderService.getReminderForTask(this.selectedTask.id).subscribe({
        next: (reminder) => {
          if (reminder) {
            this.reminderService.deleteReminder(reminder.id).subscribe({ // Updated subscribe syntax
              next: response => console.log('Recordatorio eliminado:', response),
              error: error => console.error('Error al eliminar recordatorio:', error)
            });
          }
        },
        error: (err) => {
          console.warn('No reminder to delete or error fetching reminder:', err);
        }
      });
    }
  }

  calculateReminderDate(dueDate: string | Date | undefined, daysBefore: number | undefined): Date | null {
    if (!dueDate || daysBefore === undefined || daysBefore === null) {
      return null;
    }
    const due = new Date(dueDate);
    const reminder = new Date(due);
    reminder.setDate(due.getDate() - daysBefore);
    return reminder;
  }
}