import { Component, OnInit, OnDestroy } from '@angular/core'; // Import OnDestroy
import { TaskService } from '../../services/task.service';
import { EventService } from '../../services/event.service';
import { Task } from '../../shared/interfaces/task.interface';
import { CalendarEvent } from '../../shared/interfaces/calendar-event.interface';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs'; // Import Subscription
import { NavComponent } from '../../shared/components/nav/nav.component';


@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [NavComponent, CommonModule, FormsModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit, OnDestroy { // Implement OnDestroy
  currentDate: Date = new Date();
  selectedDate: Date | null = null;
  events: CalendarEvent[] = []; // This will now be updated by the subscription
  tasks: Task[] = [];
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
  timeError: boolean = false;
  availableMinutes: number[] = [0, 30];

  // In CalendarComponent class
  newEvent: CalendarEvent = {
    id: 0,
    title: '',
    startTime: '', // Changed from 'start'
    endTime: '',   // Changed from 'end'
    description: '',
    createdAt: null, // As per requirement: always null
    user_id: null,   // As per requirement: always null
    category_id: null // As per requirement: always null
  };

  newTask: Partial<Task> = {
    title: '',
    dueDate: '' // Will store 'YYYY-MM-DD' from selected date
  };

  private eventsSubscription!: Subscription; // Declare subscription

  constructor(
    private taskService: TaskService,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    // Subscribe to event changes
    this.eventsSubscription = this.eventService.events$.subscribe(events => {
      this.events = events; // Update the local events array when the service emits
      // The service now sorts events, so no need to sort here again unless specific component logic requires it
      // this.events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      console.log('Events updated:', this.events); // Optional: Log to see updates
    });

    this.loadTasks(); // Keep task loading separate as it's not yet reactive

    this.initFormDates();
    this.updateWeekDays(); // Initialize week days based on current date
  }

  ngOnDestroy(): void { // Implement ngOnDestroy to unsubscribe
    if (this.eventsSubscription) {
      this.eventsSubscription.unsubscribe();
    }
  }

  isTask(item: Task | CalendarEvent): item is Task {
    return 'status' in item;
  }

  // loadData is no longer needed for events, rename or remove if only tasks remain
  // Renaming to loadTasks for clarity
  loadTasks(): void {
    this.tasks = this.taskService.getTasks();
    // Sort tasks
    this.tasks.sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return dateA - dateB;
    });
  }


  initFormDates(): void {
    const today = new Date();
    this.eventDate = today.toISOString().split('T')[0];
    this.startHour = 9;
    this.startMinute = 0;
    this.endHour = 10;
    this.endMinute = 0;
  }

  // Keep this method, it correctly checks if an event starts *at* the given hour on the given date
  // This is used in the template to decide if the event title should be displayed.
  // En calendar.component.ts
  isFirstHourOfEvent(event: CalendarEvent, date: Date, hour: number): boolean {
    const eventStart = new Date(event.startTime);

    // Compara año, mes y día directamente para evitar problemas de zona horaria con toISOString()
    const eventYear = eventStart.getFullYear();
    const eventMonth = eventStart.getMonth();
    const eventDay = eventStart.getDate();

    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth();
    const currentDay = date.getDate();

    // Verifica si la fecha del evento coincide con la fecha actual que se está procesando
    if (eventYear !== currentYear || eventMonth !== currentMonth || eventDay !== currentDay) {
      return false;
    }

    // Verifica si la hora de inicio del evento coincide con el slot de hora actual
    return eventStart.getHours() === hour;
  }


  updateWeekDays(): void {
    const currentDayOfWeek = this.currentDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - currentDayOfWeek); // Go back to Sunday
    startOfWeek.setHours(0, 0, 0, 0); // Set to start of day

    this.weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i); // Add i days to get each day of the week
      return {
        name: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()], // Use getDay() to get the correct name for the date
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

    const startMonth = formatDate(startDate, 'MMM', 'en-US'); // Use locale if needed
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


  getDaysInMonth(): Date[] {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1);
    const startingDay = firstDayOfMonth.getDay(); // 0 for Sunday

    const days: Date[] = [];

    // Add days from the previous month to fill the first week row
    // Add days from the previous month to fill the first week row
    const prevMonthLastDay = new Date(year, month, 0).getDate(); // This correctly gets the last day of the PREVIOUS month
    for (let i = startingDay - 1; i >= 0; i--) {
      // Corrected line: Use 'month - 1' to explicitly target the previous month
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      date.setHours(0, 0, 0, 0); // Ensure time is start of day for comparison
      days.push(date);
    }
        // Add days of the current month
    for (let i = 0; i < daysInMonth; i++) {
      const date = new Date(year, month, i + 1);
      date.setHours(0, 0, 0, 0); // Ensure time is start of day for comparison
      days.push(date);
    }

    // Add days from the next month to fill the last week row(s)
    const totalDaysDisplayed = days.length;
    // Calculate remaining slots to fill up to a multiple of 7 (for full weeks)
    const remainingSlots = totalDaysDisplayed % 7 === 0 ? 0 : 7 - (totalDaysDisplayed % 7);


    for (let i = 0; i < remainingSlots; i++) {
      const date = new Date(year, month + 1, i + 1);
      date.setHours(0, 0, 0, 0); // Ensure time is start of day for comparison
      days.push(date);
    }

    // Filter out days that are not in the current month unless needed to fill the grid
    const firstDayOfNextMonth = new Date(year, month + 1, 1);
    const lastDayOfPrevMonth = new Date(year, month, 0);


    return days.filter((day, index) => {
      const dayMonth = day.getMonth();
      const currentMonth = this.currentDate.getMonth();
      const currentYear = this.currentDate.getFullYear();
      const dayYear = day.getFullYear();

      // Always include days if they are in the current month/year
      if (dayMonth === currentMonth && dayYear === currentYear) {
        return true;
      }

      // Include trailing days from the previous month if they are in the first row
      if (index < startingDay && (dayMonth === lastDayOfPrevMonth.getMonth() || dayYear < currentYear)) { // Also check year for Dec/Jan
        return true;
      }

      // Include leading days from the next month if they are in the last row(s)
      if (index >= startingDay + daysInMonth && (dayMonth === firstDayOfNextMonth.getMonth() || dayYear > currentYear)) { // Also check year for Dec/Jan
        return true;
      }

      return false; // Otherwise, exclude the day (e.g., filling days from distant months)

    });

  }



  getEventsForDate(date: Date): (CalendarEvent | Task)[] {
    // Ensure date comparison is done based on the day, not time
    const dateStr = date.toISOString().split('T')[0];

    // Filter events that start on the given date (ignoring time)
    const timedEvents = this.events.filter(event => event.startTime && event.startTime.split('T')[0] === dateStr);

    // Filter tasks with a due date on the given date
    const tasksWithDueDate = this.tasks.filter(task => task.dueDate && task.dueDate.split('T')[0] === dateStr);

    // Combine and sort items
    const combinedItems: (CalendarEvent | Task)[] = [...timedEvents, ...tasksWithDueDate];

    // Sort by time for events, and put tasks at the end or beginning (your preference)
    combinedItems.sort((a, b) => {
      const aIsTask = this.isTask(a);
      const bIsTask = this.isTask(b);

      // Put tasks after events
      if (aIsTask && !bIsTask) return 1;
      if (!aIsTask && bIsTask) return -1;

      // If both are tasks, sort by dueDate (already done in loadTasks, but re-sort here for combined list)
      if (aIsTask && bIsTask) {
        const dateA = (a as Task).dueDate ? new Date((a as Task).dueDate!).getTime() : Infinity;
        const dateB = (b as Task).dueDate ? new Date((b as Task).dueDate!).getTime() : Infinity;
        return dateA - dateB;
      }

      // If both are events, sort by start time (already done in service, but re-sort here for combined list)
      if (!aIsTask && !bIsTask) {
        const dateA = new Date((a as CalendarEvent).startTime).getTime();
        const dateB = new Date((b as CalendarEvent).startTime).getTime();
        return dateA - dateB;
      }

      return 0; // Should not reach here
    });


    return combinedItems;
  }


  getTimedEventsForDate(date: Date): CalendarEvent[] {
    const dateStr = date.toISOString().split('T')[0];

    // Filter events that start on the given date AND have a time component
    return this.events.filter(event => event.startTime && event.startTime.split('T')[0] === dateStr && event.startTime.includes('T'));
  }


  getTasksWithDueDateForDate(date: Date): Task[] {
    const dateStr = date.toISOString().split('T')[0];
    // Filter tasks with a due date on the given date
    return this.tasks.filter(task => task.dueDate && task.dueDate.split('T')[0] === dateStr);
  }


  // This function returns events that *overlap* with the given hour slot.
  // This is needed to display events that start before the hour but continue into it.
  // Note: Visual representation of events crossing midnight is a rendering limitation
  // with the current CSS grid structure, where events are positioned within their start day's column.
  getEventsForHour(date: Date, hour: number): CalendarEvent[] {
    const targetYear = date.getFullYear();
    const targetMonth = date.getMonth();
    const targetDay = date.getDate();

    return this.events.filter(event => {
      if (!event.startTime) return false; // Asegurarse de que startTime existe

      const eventStart = new Date(event.startTime);
      const eventYear = eventStart.getFullYear();
      const eventMonth = eventStart.getMonth();
      const eventDay = eventStart.getDate();
      const eventHour = eventStart.getHours();

      // Filtra el evento solo si comienza en la fecha y hora exactas
      return eventYear === targetYear &&
        eventMonth === targetMonth &&
        eventDay === targetDay &&
        eventHour === hour;
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

    // Calcular duración en horas, incluyendo fracciones
    const durationInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Asegurar que la duración no sea negativa y limitar a 24 horas máximo
    const validDuration = Math.max(0, Math.min(durationInHours, 24));

    return `${validDuration * 100}%`;
  }

  updateEventTimes(): void {
    // Validación de fecha
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

    // Forzar 59 minutos si es hora final 23
    if (this.endHour === 23 && this.endMinute !== 59) {
        this.endMinute = 59;
    }

    const start = new Date(year, monthIndex, day, this.startHour, this.startMinute);
    let end = new Date(year, monthIndex, day, this.endHour, this.endMinute);

    // Asegurar fin de día correcto
    if (this.endHour === 23 && this.endMinute === 59) {
        end.setHours(23, 59, 59, 999);
    }

    // Validar que end sea después de start
    if (end <= start) {
        this.timeError = true;
        return;
    }

    this.timeError = false;
    this.newEvent.startTime = start.toISOString();
    this.newEvent.endTime = end.toISOString();
  }

  openEventForm(date: Date, hour?: number): void {
    this.showTaskForm = false;
    this.selectedDate = date;

    // Formatear fecha
    this.eventDate = formatDate(date, 'yyyy-MM-dd', 'en-US');

    // Determinar hora y minuto inicial
    const clickedHour = hour !== undefined ? Math.floor(hour) : 9;
    const clickedMinute = hour !== undefined && hour % 1 !== 0 ? 30 : 0;

    this.startHour = clickedHour;
    this.startMinute = clickedMinute; // Si es 23h, minuto 59

    let defaultEndTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), this.startHour, this.startMinute);
    defaultEndTime.setHours(defaultEndTime.getHours() + 1);

    this.endHour = defaultEndTime.getHours();
    this.endMinute = defaultEndTime.getMinutes();
    
    // Establecer hora final
    if (this.startHour === 23) {
        // Caso especial: si empieza a las 23h, termina a las 23:59
        this.endHour = 23;
        this.endMinute = 59;
    } else {
        // Comportamiento normal: 1 hora después
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

    // Resto del método...
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
        id: 0,
        title: '',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        description: '',
        createdAt: null,
        user_id: null,
        category_id: null
    };
    
    this.timeError = false;
    this.showEventForm = true;
  }
  openTaskForm(date: Date): void {
    this.showEventForm = false;
    this.selectedDate = date;

    this.newTask = {
      title: '',
      // Set the dueDate to the selected date formatted as 'YYYY-MM-DD'
      dueDate: formatDate(date, 'yyyy-MM-dd', 'en-US')
    };
    this.showTaskForm = true; // Show the task form
  }


  editItem(item: Task | CalendarEvent): void {
    this.showEventForm = false;
    this.showTaskForm = false;

    if (this.isTask(item)) {
      this.editTask(item as Task); // Cast to Task type
    } else {
      this.editEvent(item as CalendarEvent); // Cast to CalendarEvent type
    }
  }


  editTask(task: Task): void {
    console.log('Attempting to edit task from calendar:', task);
    // As per requirement, only display message for tasks
    alert('Para editar los detalles de una tarea (descripción, fecha, prioridad, etc.), por favor, ve a la página de "Mis Tareas". Aquí solo puedes verla.');
  }


  editEvent(event: CalendarEvent): void {
    this.showTaskForm = false;

    // Deep copy the event to avoid modifying the original data directly
    this.newEvent = {
      ...event,
      createdAt: null,
      user_id: null,
      category_id: null
    };

    const startDate = new Date(this.newEvent.startTime);
    const endDate = new Date(this.newEvent.endTime);

    // Format the start date for the date input
    this.eventDate = formatDate(startDate, 'yyyy-MM-dd', 'en-US');

    // Extract hours and minutes
    this.startHour = startDate.getHours();
    this.startMinute = startDate.getMinutes();
    this.endHour = endDate.getHours();
    this.endMinute = endDate.getMinutes();

    // The updateEventTimes() method will handle reconstructing the ISO string
    // based on the selected date and the chosen hours/minutes, including spanning days.

    this.timeError = false; // Reset error on opening form
    this.showEventForm = true;

    // Call updateEventTimes initially to set the newEvent.start/end ISO strings
    // based on the loaded date/times and perform the initial validation check.
    // This is important if the event spans days, to correctly set the form inputs
    // and validation state based on the event's ISO strings.
    this.updateEventTimes();
  }


  saveEvent(): void {
    // Basic title validation
    if (!this.newEvent.title || !this.newEvent.title.trim()) {
      alert('El título del evento no puede estar vacío.');
      return;
    }
    this.newEvent.title = this.newEvent.title.trim(); // Trim title

    // updateEventTimes was called on date/time changes, and should have set timeError
    // based on the current form values.
    // We rely on the disabled button and this check here.
    if (this.timeError) {
      alert('La hora de fin debe ser posterior a la hora de inicio y no puede exceder la medianoche del día siguiente.');
      return; // Prevent saving if there's a time error
    }

    // Call the appropriate service method (add or update)
    if (this.newEvent.id === 0) {
      this.eventService.addEvent(this.newEvent);
    } else {
      this.eventService.updateEvent(this.newEvent);
    }
    // No need to call loadData() or loadTasks() here for events, the subscription handles it.

    this.showEventForm = false;


    // No explicit updateWeekDays needed here for events, the template will react to subscribed data.
  }


  deleteEvent(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      this.eventService.deleteEvent(id);
      // No need to call loadData() or loadTasks() here for events, the subscription handles it.
      this.showEventForm = false;
      // No explicit updateWeekDays needed here for events.
    }
  }

  toggleViewMode(): void {
    this.showEventForm = false;
    this.showTaskForm = false;
    this.selectedDate = null; // Clear selected date when changing view modes

    if (this.viewMode === 'month') {
      this.viewMode = 'week';
      this.currentDate = new Date(); // Reset to today's week
      this.updateWeekDays(); // Update week days based on today
    } else { // This means current viewMode is 'week' or 'day'
      this.viewMode = 'month';
      // Set currentDate to the 1st of the month based on the current date to maintain context
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    }
  }

  selectDate(date: Date): void {
    this.showEventForm = false;
    this.showTaskForm = false;
    this.selectedDate = date; // Set the selected date
    this.viewMode = 'day'; // Switch to day view
    this.currentDate = new Date(date); // Update currentDate to the selected date for header
  }

  prevMonth(): void {
    this.showEventForm = false;
    this.showTaskForm = false;
    this.selectedDate = null; // Clear selected date

    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1 // Always go to the 1st of the month
    );
    // No need for loadData/updateWeekDays here, template reacts to currentDate
  }

  nextMonth(): void {
    this.showEventForm = false;
    this.showTaskForm = false;
    this.selectedDate = null; // Clear selected date

    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1 // Always go to the 1st of the month
    );
    // No need for loadData/updateWeekDays here
  }


  prevWeek(): void {
    this.showEventForm = false;
    this.showTaskForm = false;
    this.selectedDate = null; // Clear selected date

    this.currentDate.setDate(this.currentDate.getDate() - 7);
    this.updateWeekDays(); // Need to update week days as the date range changes
    // No need for loadData here
  }

  nextWeek(): void {
    this.showEventForm = false;
    this.showTaskForm = false;
    this.selectedDate = null; // Clear selected date
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    this.updateWeekDays(); // Need to update week days
    // No need for loadData here
  }


  closeDayView(): void {
    this.showEventForm = false;
    this.showTaskForm = false;

    if (this.selectedDate) {
      // When closing day view, switch back to week view centered around the selected date's week
      this.currentDate = new Date(this.selectedDate); // Set currentDate to the selected date
      this.updateWeekDays(); // Calculate the week days for that date
      this.viewMode = 'week'; // Switch to week view
      this.selectedDate = null; // Clear selected date
    } else {
      // Fallback if selectedDate is null (shouldn't happen if coming from day view)
      console.warn('Exiting day view but selectedDate is null, defaulting to current week.');
      this.viewMode = 'week';
      this.currentDate = new Date(); // Default to today's week
      this.updateWeekDays();
      this.selectedDate = null;
    }
  }


  saveTaskFromCalendar(): void {
    // Basic title validation
    if (!this.newTask.title || !this.newTask.title.trim()) {
      alert('El título de la tarea no puede estar vacío.');
      return;
    }
    this.newTask.title = this.newTask.title.trim(); // Trim title

    // Ensure dueDate is set (it should be when opening the form from a date)
    if (this.newTask.dueDate) {
      const taskToSave: Task = {
        id: 0, // ID will be assigned by the TaskService
        title: this.newTask.title,
        status: 'pending', // Tasks created here are initially not completed
        createdAt: new Date().toISOString(), // Set creation date
        dueDate: this.newTask.dueDate,
        user_id: null // Use the selected date as the due date
        // Description, priority, etc. are not handled in this form, as per original logic/alert
      };
      this.taskService.addTask(taskToSave);
      this.loadTasks(); // Reload tasks after adding (tasks are not yet reactive)
      this.showTaskForm = false;
      this.newTask = { title: '', dueDate: '' }; // Reset form
    } else {
      alert('Error: No se pudo determinar la fecha de vencimiento para la tarea.');
      this.cancelTaskForm(); // Close the form
    }
  }

  cancelTaskForm(): void {
    this.showTaskForm = false;
    this.newTask = { title: '', dueDate: '' }; // Reset form
    this.selectedDate = null; // Clear selected date
  }

  // This method is not used in the provided HTML, but keeping it in case it's used elsewhere
  formatTime(hour: number, minute: number): string {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  // Helper to determine if a date is in the current month for month view styling
  isDateInCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentDate.getMonth() &&
      date.getFullYear() === this.currentDate.getFullYear();
  }
}
