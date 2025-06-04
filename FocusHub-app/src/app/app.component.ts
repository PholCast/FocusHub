// src/app/app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ReminderService } from './services/reminder.service';
import { TaskService } from './services/task.service';
import { EventService } from './services/event.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'FocusHub-app';
  private reminderCheckInterval: any;

  constructor(
    private reminderService: ReminderService,
    private taskService: TaskService,
    private eventService: EventService
  ) { }

  ngOnInit() {
    this.initializeReminderCheck();
  }

  ngOnDestroy() {
    if (this.reminderCheckInterval) {
      clearInterval(this.reminderCheckInterval);
    }
  }

  private initializeReminderCheck() {
    // Verificación inmediata al iniciar
    this.checkReminders();

    // Configurar intervalo para verificar cada 12 segundos
    this.reminderCheckInterval = setInterval(() => {
      this.checkReminders();
    }, 12000);
  }

  private checkReminders() {

    console.log('--- Iniciando verificación de recordatorios ---');
    console.log('Hora actual:', new Date().toLocaleString());

    // Verificar recordatorios de tareas
    if (this.taskService.tasks().length > 0) {
      console.log('Tareas encontradas:', this.taskService.tasks().length);
      this.taskService.tasks().forEach(task => {
        if (task.dueDate) {
          this.reminderService.getReminderForTask(task.id).subscribe({
            next: (reminder) => {
              if (reminder) {
                console.log(`Recordatorio de tarea encontrado (ID: ${reminder.id})`, {
                  taskId: task.id,
                  taskTitle: task.title,
                  reminderTime: new Date(reminder.reminderTime).toLocaleString(),
                  status: reminder.status,
                  isDue: new Date(reminder.reminderTime) <= new Date(),
                  shouldNotify: reminder.status === 1 && new Date(reminder.reminderTime) <= new Date()
                });

                if (new Date(reminder.reminderTime) <= new Date() && reminder.status === 1) {
                  this.showTaskReminder(task, reminder);
                }
              } else {
                console.log(`No hay recordatorio para la tarea ID: ${task.id} - "${task.title}"`);
              }
            }
          });
        }
      });
    } else {
      console.log('No hay tareas cargadas para verificar');
    }

    // Verificar recordatorios de eventos
    if (this.eventService.events().length > 0) {
      this.eventService.events().forEach(event => {
        if (event.startTime) {
          this.reminderService.getEventReminderForEvent(event.id).subscribe({
            next: (reminder) => {
              if (reminder) {
                // Conversión segura del status
                const isActive = typeof reminder.status === 'number'
                  ? reminder.status === 1
                  : reminder.status === true;

                console.log(`Recordatorio de evento encontrado (ID: ${reminder.id})`, {
                  eventId: event.id,
                  eventTitle: event.title,
                  reminderTime: new Date(reminder.reminderTime).toLocaleString(),
                  status: reminder.status,
                  isDue: new Date(reminder.reminderTime) <= new Date(),
                  shouldNotify: isActive && new Date(reminder.reminderTime) <= new Date()
                });

                if (new Date(reminder.reminderTime) <= new Date() && isActive) {
                  this.showEventReminder(event, reminder);
                }
              }
            }
          });
        }
      });
    } else {
      console.log('No hay eventos cargados para verificar');
    }

    console.log('--- Finalizada verificación de recordatorios ---\n');
  }

  private showTaskReminder(task: any, reminder: any) {
    const notificationMsg = `Recordatorio de Tarea: ${task.title} - Vence el ${new Date(task.dueDate!).toLocaleDateString()}`;
    console.log('Mostrando notificación:', notificationMsg);

    this.reminderService.showDesktopNotification(`Recordatorio de Tarea: ${task.title}`, {
      body: `Tu tarea "${task.title}" vence el ${new Date(task.dueDate!).toLocaleDateString()}.`,
      icon: 'assets/notification-icon.png'
    });

    this.reminderService.markReminderAsNotified(reminder.id).subscribe({
      next: () => console.log(`Recordatorio de tarea ${reminder.id} marcado como notificado.`),
      error: (err) => console.error(`Error al marcar recordatorio de tarea ${reminder.id}:`, err)
    });
  }

  private showEventReminder(event: any, reminder: any) {
    const notificationMsg = `Recordatorio de Evento: ${event.title} - Comienza a las ${new Date(event.startTime).toLocaleTimeString()}`;
    console.log('Mostrando notificación:', notificationMsg);

    this.reminderService.showDesktopNotification(`Recordatorio de Evento: ${event.title}`, {
      body: `Tu evento "${event.title}" comienza a las ${new Date(event.startTime).toLocaleTimeString()}.`,
      icon: 'assets/notification-icon.png'
    });

    this.reminderService.markReminderAsNotifiedEvent(reminder.id).subscribe({
      next: () => console.log(`Recordatorio de evento ${reminder.id} marcado como notificado.`),
      error: (err) => console.error(`Error al marcar recordatorio de evento ${reminder.id}:`, err)
    });
  }
}