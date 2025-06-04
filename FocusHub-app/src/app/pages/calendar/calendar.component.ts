import { Component, OnInit, OnDestroy, WritableSignal, signal, effect } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { EventService } from '../../services/event.service';
import { Task } from '../../shared/interfaces/task.interface';
import { CalendarEvent } from '../../shared/interfaces/calendar-event.interface';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NavComponent } from '../../shared/components/nav/nav.component';
import { ReminderService } from '../../services/reminder.service';


@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [NavComponent, CommonModule, FormsModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  currentDate: Date = new Date();
  selectedDate: Date | null = null;
  showEventForm = false;
  showTaskForm = false;
  viewMode: 'month' | 'week' | 'day' = 'month';
  hours: number[] = Array.from({ length: 24 }, (_, i) => i);
  weekDays: { name: string, date: Date }[] = [];

  eventDate: string = '';
  startHour: number = 9;
  startMinute: number = 0;
  endHour: number = 10;
  endMinute: number = 0;
  timeError = false;
  availableMinutes: number[] = [0, 30];


  newEvent: Partial<CalendarEvent> = {
    id: 0,
    title: '',
    startTime: '',
    endTime: '',
    description: '',
    remindersHoursBefore: null
  };

  newTask: Partial<Task> = {
    title: '',
    dueDate: ''
  };

  constructor(
    private taskService: TaskService,
    private eventService: EventService,
    private reminderService: ReminderService
  ) { 
    this.eventService.fetchEvents();
    this.taskService.loadTasks();
  }

  ngOnInit(): void {
    // Simplemente invocar carga (fetch) en ambos servicios
    this.eventService.fetchEvents();
    this.taskService.loadTasks();

    // Inicializaciones locales
    this.initFormDates();
    this.updateWeekDays();

    // Los signals de events y tasks los usarás directamente en el template o en otras partes
  }

  isTask(item: Task | CalendarEvent): item is Task {
    return 'status' in item;
  }

  loadTasks(): void {
    this.taskService.loadTasks(); // la actualización ocurre internamente en el service
  }


  initFormDates(): void {
    const today = new Date();
    this.eventDate = today.toISOString().split('T')[0];
    this.startHour = 9;
    this.startMinute = 0;
    this.endHour = 10;
    this.endMinute = 0;
  }

  isFirstHourOfEvent(event: CalendarEvent, date: Date, hour: number): boolean {
    const eventStart = new Date(event.startTime);

    const eventYear = eventStart.getFullYear();
    const eventMonth = eventStart.getMonth();
    const eventDay = eventStart.getDate();

    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth();
    const currentDay = date.getDate();


    if (eventYear !== currentYear || eventMonth !== currentMonth || eventDay !== currentDay) {
      return false;
    }


    return eventStart.getHours() === hour;
  }


  updateWeekDays(): void {  // accede al valor de la signal
    const currentDayOfWeek = (this.currentDate).getDay();
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    this.weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      return {
        name: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()],
        date: date
      };
    });
  }


  getWeekRange(): string {
    if (this.weekDays.length === 0) {
      return '';
    }
    const startDate = this.weekDays[0].date;
    const endDate = this.weekDays[6].date;

    const startMonth = formatDate(startDate, 'MMM', 'en-US');
    const endMonth = formatDate(endDate, 'MMM', 'en-US');
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const year = startDate.getFullYear();

    if (startDate.getFullYear() !== endDate.getFullYear()) {
      return `${startMonth} ${startDay}, ${startDate.getFullYear()} - ${endMonth} ${endDay}, ${endDate.getFullYear()}`;
    } else if (startDate.getMonth() === endDate.getMonth()) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  }

  getDaysInMonth(): Date[] { // accede al valor de la signal
    const year = (this.currentDate).getFullYear();
    const month = (this.currentDate).getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1);
    const startingDay = firstDayOfMonth.getDay();

    const days: Date[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {

      const date = new Date(year, month - 1, prevMonthLastDay - i);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }

    for (let i = 0; i < daysInMonth; i++) {
      const date = new Date(year, month, i + 1);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }


    const totalDaysDisplayed = days.length;

    const remainingSlots = totalDaysDisplayed % 7 === 0 ? 0 : 7 - (totalDaysDisplayed % 7);


    for (let i = 0; i < remainingSlots; i++) {
      const date = new Date(year, month + 1, i + 1);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }


    const firstDayOfNextMonth = new Date(year, month + 1, 1);
    const lastDayOfPrevMonth = new Date(year, month, 0);


    return days.filter((day, index) => {
      const dayMonth = day.getMonth();
      const currentMonth = this.currentDate.getMonth();
      const currentYear = this.currentDate.getFullYear();
      const dayYear = day.getFullYear();


      if (dayMonth === currentMonth && dayYear === currentYear) {
        return true;
      }


      if (index < startingDay && (dayMonth === lastDayOfPrevMonth.getMonth() || dayYear < currentYear)) {
        return true;
      }


      if (index >= startingDay + daysInMonth && (dayMonth === firstDayOfNextMonth.getMonth() || dayYear > currentYear)) {
        return true;
      }

      return false;

    });

  }


  getEventsForDate(date: Date): (CalendarEvent | Task)[] {
    // Normalizar la fecha de entrada (sin horas/minutos/segundos)
    const normalizedInputDate = new Date(date);
    normalizedInputDate.setHours(0, 0, 0, 0);
    const inputDateStr = normalizedInputDate.toISOString().split('T')[0];

    const allEvents = this.eventService.events();
    const allTasks = this.taskService.tasks();
    
    // Filtrar eventos
    const timedEvents = allEvents.filter((event: CalendarEvent) => {
      if (!event.startTime) return false;

      // Normalizar fecha del evento
      const eventDate = new Date(event.startTime);
      eventDate.setHours(0, 0, 0, 0);
      const eventDateStr = eventDate.toISOString().split('T')[0];

      return eventDateStr === inputDateStr;
    });

    // Filtrar tareas
    const tasksWithDueDate = allTasks.filter((task: Task) => {
      if (!task.dueDate) return false;

      // Normalizar fecha de la tarea
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      const taskDateStr = taskDate.toISOString().split('T')[0];

      return taskDateStr === inputDateStr;
    });

    // Combinar y ordenar
    const combinedItems: (CalendarEvent | Task)[] = [...timedEvents, ...tasksWithDueDate];

    combinedItems.sort((a, b) => {
      const aIsTask = this.isTask(a);
      const bIsTask = this.isTask(b);

      // Tareas después de eventos
      if (aIsTask && !bIsTask) return 1;
      if (!aIsTask && bIsTask) return -1;

      // Ordenar tareas por fecha de vencimiento
      if (aIsTask && bIsTask) {
        const dateA = (a as Task).dueDate ? new Date((a as Task).dueDate!).getTime() : Infinity;
        const dateB = (b as Task).dueDate ? new Date((b as Task).dueDate!).getTime() : Infinity;
        return dateA - dateB;
      }

      // Ordenar eventos por hora de inicio
      if (!aIsTask && !bIsTask) {
        const dateA = new Date((a as CalendarEvent).startTime).getTime();
        const dateB = new Date((b as CalendarEvent).startTime).getTime();
        return dateA - dateB;
      }

      return 0;
    });

    return combinedItems;
  }



  getTimedEventsForDate(date: Date): CalendarEvent[] {
    const dateStr = date.toISOString().split('T')[0];
    const allEvents = this.eventService.events();


    return allEvents.filter((event: CalendarEvent) =>
      event.startTime &&
      event.startTime.split('T')[0] === dateStr &&
      event.startTime.includes('T')
    );
  }

  getTasksWithDueDateForDate(date: Date): Task[] {
    const dateStr = date.toISOString().split('T')[0];
    const allTasks = this.taskService.tasks();

    return allTasks.filter((task: Task) =>
      task.dueDate && task.dueDate.split('T')[0] === dateStr
    );
  }

  getEventsForHour(date: Date, hour: number): CalendarEvent[] {
    const targetYear = date.getFullYear();
    const targetMonth = date.getMonth();
    const targetDay = date.getDate();

    const allEvents = this.eventService.events();

    return allEvents.filter((event: CalendarEvent) => {
      if (!event.startTime) return false;

      const eventStart = new Date(event.startTime);
      const eventYear = eventStart.getFullYear();
      const eventMonth = eventStart.getMonth();
      const eventDay = eventStart.getDate();
      const eventHour = eventStart.getHours();
      return (
        eventYear === targetYear &&
        eventMonth === targetMonth &&
        eventDay === targetDay &&
        eventHour === hour
      );
    });
  }


  getEventTopPosition(event: CalendarEvent): string {
    const start = new Date(event.startTime);
    const minutes = start.getMinutes();

    return `${(minutes / 60) * 100}%`;
  }


  getEventHeight(event: CalendarEvent): string {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);


    const durationInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);


    const validDuration = Math.max(0, Math.min(durationInHours, 24));

    return `${validDuration * 100}%`;
  }

  updateEventTimes(): void {
    if (!this.eventDate || typeof this.eventDate !== 'string') {
      this.timeError = true;
      return;
    }

    const dateParts = this.eventDate.split('-').map(part => parseInt(part, 10));
    if (dateParts.some(isNaN) || dateParts.length !== 3) {
      this.timeError = true;
      return;
    }

    const year = dateParts[0];
    const monthIndex = dateParts[1] - 1;
    const day = dateParts[2];

    if (this.endHour === 23 && this.endMinute !== 59) {
      this.endMinute = 59;
    }

    const start = new Date(year, monthIndex, day, this.startHour, this.startMinute);
    let end = new Date(year, monthIndex, day, this.endHour, this.endMinute);

    if (this.endHour === 23 && this.endMinute === 59) {
      end.setHours(23, 59, 59, 999);
    }

    if (end <= start) {
      this.timeError = true;
      return;
    }

    this.timeError = false;

    const reminderTime = this.newEvent.remindersHoursBefore !== null && this.newEvent.remindersHoursBefore !== undefined
      ? this.calculateEventReminderTime(start.toISOString(), this.newEvent.remindersHoursBefore)
      : null;

    const updatedEvent = {
      ...this.newEvent,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      eventReminderId: undefined, // Resetear el ID del recordatorio existente
      reminderTime: reminderTime 
    };

    this.newEvent = updatedEvent;

    
  }


  openEventForm(date: Date, hour?: number): void {
    this.showTaskForm = false;
    this.selectedDate = date;


    this.eventDate = formatDate(date, 'yyyy-MM-dd', 'en-US');


    const clickedHour = hour !== undefined ? Math.floor(hour) : 9;
    const clickedMinute = hour !== undefined && hour % 1 !== 0 ? 30 : 0;

    this.startHour = clickedHour;
    this.startMinute = clickedMinute;

    let defaultEndTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), this.startHour, this.startMinute);
    defaultEndTime.setHours(defaultEndTime.getHours() + 1);

    this.endHour = defaultEndTime.getHours();
    this.endMinute = defaultEndTime.getMinutes();


    if (this.startHour === 23) {

      this.endHour = 23;
      this.endMinute = 59;
    } else {

      const defaultEndTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        this.startHour,
        this.startMinute
      );
      defaultEndTime.setHours(defaultEndTime.getHours() + 1);

      this.endHour = defaultEndTime.getHours();
      this.endMinute = defaultEndTime.getMinutes();

    }


    const start = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      this.startHour,
      this.startMinute
    );

    const end = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      this.endHour,
      this.endMinute
    );

    this.newEvent = {
      title: '',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      description: '',
      createdAt: null,
      user_id: null,
      category_id: null,
      remindersHoursBefore: null, // MODIFIED: Reset to null for new event
      eventReminderId: undefined
    };

    this.timeError = false;
    this.showEventForm = true;
    const reminderTime = this.calculateEventReminderTime(
      this.newEvent.startTime,
      this.newEvent.remindersHoursBefore ?? undefined
    );
  }


  openTaskForm(date: Date): void {
    this.showEventForm = false;
    this.selectedDate = date;

    this.newTask = {
      title: '',

      dueDate: formatDate(date, 'yyyy-MM-dd', 'en-US')
    };
    this.showTaskForm = true;
  }


  editItem(item: Task | CalendarEvent): void {
    this.showEventForm = false;
    this.showTaskForm = false;

    if (this.isTask(item)) {
      this.editTask(item as Task);
    } else {
      this.editEvent(item as CalendarEvent);
    }
  }


  editTask(task: Task): void {
    console.log('Attempting to edit task from calendar:', task);

    alert('Para editar los detalles de una tarea (descripción, fecha, prioridad, etc.), por favor, ve a la página de "Mis Tareas". Aquí solo puedes verla.');
  }


  editEvent(event: CalendarEvent): void {
    this.showTaskForm = false;

    this.newEvent = {
      ...event,
      createdAt: null,
      user_id: null,
      category_id: null,
      remindersHoursBefore: null,
      eventReminderId: undefined
    };

    const startDate = new Date(this.newEvent.startTime!);
    const endDate = new Date(this.newEvent.endTime!);

    this.eventDate = formatDate(startDate, 'yyyy-MM-dd', 'en-US');
    this.startHour = startDate.getHours();
    this.startMinute = startDate.getMinutes();
    this.endHour = endDate.getHours();
    this.endMinute = endDate.getMinutes();

    this.timeError = false;
    this.showEventForm = true;

    this.updateEventTimes();

    if (event.id) {
      this.reminderService.getEventReminderForEvent(event.id).subscribe({
        next: (eventReminder) => {
          if (eventReminder) {
            // Calculate hours before based on reminder time and event start time
            const calculatedHoursBefore = this.calculateHoursBefore(
              new Date(event.startTime!),
              new Date(eventReminder.reminderTime)
            );

            this.newEvent = {
              ...this.newEvent,
              eventReminderId: eventReminder.id,
              remindersHoursBefore: calculatedHoursBefore
            };
          }
        },
        error: (err) => {
          console.error('Error fetching event reminder:', err);
          this.newEvent = { ...this.newEvent, remindersHoursBefore: null, eventReminderId: undefined };
        }
      });
    }
  }

  calculateEventReminderTime(startTime: string | Date | undefined, hoursBefore: number | undefined): Date | null {
    // 1. Validación de datos
    if (!startTime || hoursBefore === undefined || hoursBefore === null) {
      return null;
    }

    // 2. Convertir a objeto Date
    const eventStart = new Date(startTime);

    // 3. Crear fecha recordatorio
    const reminderTime = new Date(eventStart);

    // 4. Restar las horas (aquí la diferencia clave con tasks)
    reminderTime.setHours(reminderTime.getHours() - hoursBefore);

    return reminderTime;
  }
  // NEW: Helper to calculate remindersHoursBefore from actual times (for editEvent)
  private calculateHoursBefore(eventStartTime: Date, reminderTime: Date): number | null {
    const diffMs = eventStartTime.getTime() - reminderTime.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60)); // Round to nearest hour

    // Check if the difference matches our known options
    if ([1, 2, 12, 24].includes(diffHours)) {
      return diffHours;
    }
    return null; // No match found, or not a standard option
  }


  // This method now just ensures the newEvent.remindersHoursBefore is set
  updateEventReminder(): void {
    // The ngModel change already updates newEvent.remindersHoursBefore.
    // We just need to make sure the calculated time is updated if needed.
    const reminderTime = this.calculateEventReminderTime(
      this.newEvent.startTime,
      this.newEvent.remindersHoursBefore ?? undefined
    );
  }




  saveEvent(): void {
    console.log("entra a saveEvent()");
    const event = this.newEvent;
    // Validar título
    if (!event.title || !event.title.trim()) {
      alert('El título del evento no puede estar vacío.');
      return;
    }
    // Actualizar título con trim usando set()
    this.newEvent = {
      ...event,
      title: event.title.trim(),
    };
    // Validar error de tiempo (leer valor del signal)
    if (this.timeError) {
      alert('La hora de fin debe ser posterior a la hora de inicio y no puede exceder la medianoche del día siguiente.');
      return;
    }
    const reminderTime = this.calculateEventReminderTime(
      this.newEvent.startTime,
      this.newEvent.remindersHoursBefore ?? undefined
    );

    // Si id existe (y es distinto de null o undefined), actualizar; sino, crear nuevo
    if (event.id) {
      this.eventService.updateEvent(event).subscribe({
        next: () => {
          console.log('Evento actualizado:', event.id);
          // Handle reminder update/creation/deletion after event update
          this.handleEventReminderUpdate(event.id!, reminderTime, event.eventReminderId);
          this.showEventForm = false;
        },
        error: (err) => {
          console.error('Error al actualizar evento:', err);
          alert('No se pudo actualizar el evento.');
        }
      });
    } else {
      // Create new event
      this.eventService.createEvent(event).subscribe({
        next: (createdEvent) => {
          console.log('Evento creado:', createdEvent.id);
          // Handle reminder creation after event creation
          if (createdEvent.id && reminderTime) {
            this.reminderService.createEventReminder(createdEvent.id, reminderTime).subscribe({
              next: (response) => {
                console.log('Recordatorio de evento creado:', response);
              },
              error: (err) => console.error('Error al crear recordatorio de evento:', err)
            });
          }
          this.showEventForm = false;
        },
        error: (err) => {
          console.error('Error al crear evento:', err);
          alert('No se pudo guardar el evento.');
        }
      });
    }
    // Ocultar formulario (usar set para signals booleanos)
    this.showEventForm = false;
  }

  private handleEventReminderUpdate(eventId: number, reminderTime: Date | null, existingReminderId: number | undefined): void {
    if (reminderTime && reminderTime.getTime() > new Date().getTime()) { // Only create/update if reminder time is in the future
      if (existingReminderId) {
        // Update existing reminder
        this.reminderService.updateEventReminder(existingReminderId, reminderTime).subscribe({
          next: (response) => console.log('Recordatorio de evento actualizado:', response),
          error: (err) => console.error('Error al actualizar recordatorio de evento:', err)
        });
      } else {
        // Create new reminder
        this.reminderService.createEventReminder(eventId, reminderTime).subscribe({
          next: (response) => console.log('Recordatorio de evento creado:', response),
          error: (err) => console.error('Error al crear recordatorio de evento:', err)
        });
      }
    } else if (existingReminderId) {
      // If reminder option is 'none' or reminderTime is not valid/past, delete existing reminder
      this.reminderService.deleteEventReminder(existingReminderId).subscribe({
        next: () => console.log('Recordatorio de evento eliminado.'),
        error: (err) => console.error('Error al eliminar recordatorio de evento:', err)
      });
    }
  }




  deleteEvent(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      // First delete any associated reminder
      this.reminderService.getEventReminderForEvent(id).subscribe({
        next: (reminder) => {
          if (reminder) {
            this.reminderService.deleteEventReminder(reminder.id).subscribe({
              next: () => {
                // After deleting reminder, delete the event
                this.eventService.deleteEvent(id).subscribe({
                  next: () => {
                    console.log('Event deleted:', id);
                    this.showEventForm = false;
                  },
                  error: (err) => console.error('Error deleting event:', err)
                });
              },
              error: (err) => {
                console.error('Error deleting event reminder:', err);
                // Still try to delete the event even if reminder deletion fails
                this.eventService.deleteEvent(id).subscribe({
                  next: () => {
                    console.log('Event deleted after failed reminder deletion:', id);
                    this.showEventForm = false;
                  },
                  error: (err) => console.error('Error deleting event:', err)
                });
              }
            });
          } else {
            // No reminder found, just delete the event
            this.eventService.deleteEvent(id).subscribe({
              next: () => {
                console.log('Event deleted (no reminder):', id);
                this.showEventForm = false;
              },
              error: (err) => console.error('Error deleting event:', err)
            });
          }
        },
        error: (err) => {
          console.error('Error checking for event reminder:', err);
          // Still try to delete the event even if reminder check fails
          this.eventService.deleteEvent(id).subscribe({
            next: () => {
              console.log('Event deleted after failed reminder check:', id);
              this.showEventForm = false;
            },
            error: (err) => console.error('Error deleting event:', err)
          });
        }
      });
    }
  }

  toggleViewMode(): void {
    this.showEventForm = false;
    this.showTaskForm = false;
    this.selectedDate = null;

    if (this.viewMode === 'month') {
      this.viewMode = 'week';
      this.currentDate = new Date();
      this.updateWeekDays();
    } else {
      this.viewMode = 'month';
      const current = this.currentDate;
      this.currentDate = new Date(current.getFullYear(), current.getMonth(), 1);
    }
  }

  selectDate(date: Date): void {
    this.showEventForm = false;
    this.showTaskForm = false;
    this.selectedDate = date;
    this.viewMode = 'day';
    this.currentDate = new Date(date);
  }


  prevMonth(): void {
    this.showEventForm = false;
    this.showTaskForm = false;
    this.selectedDate = null;

    const current = this.currentDate;
    this.currentDate = new Date(current.getFullYear(), current.getMonth() - 1, 1);
  }

  nextMonth(): void {
    this.showEventForm = false;
    this.showTaskForm = false;
    this.selectedDate = null;

    const current = this.currentDate;
    this.currentDate = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  prevWeek(): void {
    this.showEventForm = false;
    this.showTaskForm = false;
    this.selectedDate = null;

    const current = this.currentDate;
    const newDate = new Date(current);
    newDate.setDate(current.getDate() - 7);
    this.currentDate = newDate;
    this.updateWeekDays();
  }

  nextWeek(): void {
    this.showEventForm = false;
    this.showTaskForm = false;
    this.selectedDate = null;

    const current = this.currentDate;
    const newDate = new Date(current);
    newDate.setDate(current.getDate() + 7);
    this.currentDate = newDate;
    this.updateWeekDays();
  }


  closeDayView(): void {
    this.showEventForm = false;
    this.showTaskForm = false;

    if (this.selectedDate) {
      this.currentDate = new Date(this.selectedDate!);
      this.updateWeekDays();
      this.viewMode = 'week';
      this.selectedDate = null;
    } else {
      console.warn('Exiting day view but selectedDate is null, defaulting to current week.');
      this.viewMode = 'week';
      this.currentDate = new Date();
      this.updateWeekDays();
      this.selectedDate = null;
    }
  }


  saveTaskFromCalendar(): void {
    const current = this.newTask;

    // 1) Validar que 'title' exista y no esté vacío
    if (!current.title || !current.title.trim()) {
      alert('El título de la tarea no puede estar vacío.');
      return;
    }
    // 2) Actualizar el título con trim usando .set()
    this.newTask = {
      ...current,
      title: current.title.trim()
    };
    // 3) Volver a leer el signal para usar la versión recortada
    const updated = this.newTask;

    // 4) Validar que 'dueDate' exista
    if (updated.dueDate) {
      // Aquí sabemos que updated.dueDate y updated.title no son undefined
      const taskToSave: Task = {
        id: 0,
        title: updated.title!,               // ya validamos que existe y no está vacío
        status: 'pending',
        createdAt: new Date().toISOString(),
        dueDate: updated.dueDate!,           // ya validamos que existe
        user_id: null
      };

      this.taskService.addTask(taskToSave).subscribe({
        next: (addedTask) => {
          console.log('Tarea creada con éxito:', addedTask);
          // No es necesario llamar a loadTasks() aquí si tu service.addTask ya actualiza la signal.
          // Pero si quieres asegurar que todo esté resincronizado, podrías hacerlo.
          // this.taskService.loadTasks(); // Esto sería redundante si addTask() ya hace el this.tasks.update()
          
          // Limpiar el formulario y ocultarlo
          this.showTaskForm = false;
          this.newTask = { title: '', dueDate: '' };
        },
        error: (err) => {
          console.error('Error al crear la tarea:', err);
          alert('No se pudo guardar la tarea.');
        }
      });
    } else {
      alert('Error: No se pudo determinar la fecha de vencimiento para la tarea.');
      this.cancelTaskForm();
    }
  }


  cancelTaskForm(): void {
    this.showTaskForm = false;
    this.newTask = { title: '', dueDate: '' };
    this.selectedDate = null;
  }

  formatTime(hour: number, minute: number): string {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  isDateInCurrentMonth(date: Date): boolean {
    const current = this.currentDate;
    return date.getMonth() === current.getMonth() &&
      date.getFullYear() === current.getFullYear();
  }
}