// src/app/services/reminder.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, timer, switchMap, of, catchError, map } from 'rxjs';
import { TokenService } from './token.service';
import { Task } from '../shared/interfaces/task.interface';
import { TaskReminder } from '../shared/interfaces/task-reminder.interface';
import { EventReminder } from '../shared/interfaces/event-reminder.interface'; // NEW: Import EventReminder
@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  private readonly baseUrl = 'http://backend:3000/reminders';
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);

  // No longer needed if app.component handles polling
  // private pollingInterval$ = new BehaviorSubject<number | null>(null);

  constructor() {
    this.requestNotificationPermission();
  }

  private getHeaders() {
    const token = this.tokenService.getToken();
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }

  private requestNotificationPermission(): void {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('Permiso de notificación concedido.');
          } else {
            console.warn('Permiso de notificación denegado.');
          }
        });
      }
    } else {
      console.warn('Este navegador no soporta notificaciones de escritorio.');
    }
  }

  showDesktopNotification(title: string, options?: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    } else {
      console.warn('No hay permiso para mostrar notificaciones de escritorio o no son soportadas.');
      // Fallback if no permission (e.g., show a custom message box, NOT alert)
      // For now, we'll keep the alert as a temporary visual fallback if you don't have a custom modal
      alert(`Recordatorio: ${title} - ${options?.body || ''}`);
    }
  }

  // --- NEW METHOD: Mark Reminder as Notified ---
  markReminderAsNotified(reminderId: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${reminderId}/status`, { status: 0 }, this.getHeaders())
      .pipe(
        catchError(error => {
          console.error(`Error al marcar recordatorio ${reminderId} como notificado:`, error);
          throw error; // Re-throw the error
        })
      );
  }

  // Removed simulateReminderTrigger as it's not needed with persistent status and polling

  // Removed startPollingForReminders and stopPollingForReminders as app.component handles the interval

  createReminder(taskId: number, reminderTime: Date): Observable<TaskReminder> {
    return this.http.post<TaskReminder>(`${this.baseUrl}/task`, {
      taskId,
      reminderTime: reminderTime.toISOString(),
      notificationType: 'desktop'
    }, this.getHeaders());
  }

  updateReminder(reminderId: number, reminderTime: Date): Observable<TaskReminder> {
    return this.http.patch<TaskReminder>(`${this.baseUrl}/${reminderId}`, {
      reminderTime: reminderTime.toISOString(),
      notificationType: 'desktop',
      status: 1 
    }, this.getHeaders());
  }

  deleteReminder(reminderId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${reminderId}`, this.getHeaders());
  }

  getReminderForTask(taskId: number): Observable<TaskReminder | null> {
    return this.http.get<TaskReminder>(`${this.baseUrl}/task/${taskId}`, this.getHeaders())
      .pipe(
        catchError(error => {
          if (error.status === 404) {
            return of(null);
          }
          throw error;
        })
      );
  }

  // Removed showReminderPopup as we are using showDesktopNotification directly

  // --- NEW: Event Reminders ---
  createEventReminder(eventId: number, reminderTime: Date): Observable<EventReminder> {
    return this.http.post<EventReminder>(`${this.baseUrl}/event`, {
      eventId,
      reminderTime: reminderTime.toISOString(),
      notificationType: 'desktop',
      status: true // Set to active by default (boolean)
    }, this.getHeaders());
  }

  // For updating event reminders
  updateEventReminder(reminderId: number, reminderTime: Date): Observable<EventReminder> {
    return this.http.patch<EventReminder>(`${this.baseUrl}/event/${reminderId}`, {
      reminderTime: reminderTime.toISOString(),
      notificationType: 'desktop',
      status: true // Reset to active when updating (boolean)
    }, this.getHeaders());
  }

  deleteEventReminder(reminderId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/event/${reminderId}`, this.getHeaders());
  }

  getEventReminderForEvent(eventId: number): Observable<EventReminder | null> {
    return this.http.get<any>(`${this.baseUrl}/event/${eventId}`).pipe(
      map(response => {
        if (!response) return null;
        
        return {
          id: response.id,
          eventId: response.eventId,
          reminderTime: response.reminderTime,
          notificationType: response.notificationType,
          status: response.status === 1 || response.status === true, // Conversión segura
          ...(response.createdAt && { createdAt: response.createdAt }),
          ...(response.updatedAt && { updatedAt: response.updatedAt })
        } as EventReminder;
      }),
      catchError(error => {
        if (error.status === 404) return of(null);
        throw error;
      })
    );
  }
  
  markReminderAsNotifiedEvent(reminderId: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/event/${reminderId}/status`, 
      { status: false }, // Usa false para eventos
      this.getHeaders()
    ).pipe(
      catchError(error => {
        console.error(`Error al marcar recordatorio de evento ${reminderId}:`, error);
        throw error;
      })
    );
  }
}