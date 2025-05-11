import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { EventService } from '../../services/event.service';
import { Task } from '../../shared/interfaces/task.interface';
import { CalendarEvent } from '../../shared/interfaces/calendar-event.interface';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  currentDate: Date = new Date();
  selectedDate: Date | null = null;
  events: CalendarEvent[] = [];
  tasks: Task[] = [];
  showEventForm = false;
  showTaskForm = false;
  viewMode: 'month' | 'week' | 'day' = 'month';

  hours: number[] = Array.from({ length: 24 }, (_, i) => i);
  weekDays: {name: string, date: Date}[] = [];


  eventDate: string = '';
  startHour: number = 9;
  startMinute: number = 0;
  endHour: number = 10;
  endMinute: number = 0;
  timeError: boolean = false;
  availableMinutes: number[] = [0, 30];

  newEvent: CalendarEvent = {
    id: 0,
    title: '',
    start: '',
    end: '',
    description: ''
  };


  newTask: Partial<Task> = {
    title: '',
    dueDate: '' // Will store 'YYYY-MM-DD' from selected date
  };


  constructor(
    private taskService: TaskService,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    this.loadData();
    this.initFormDates();
    this.updateWeekDays(); // Initialize week days based on current date
  }

  isTask(item: Task | CalendarEvent): item is Task {
    return 'completed' in item;
  }

  loadData(): void {
    this.tasks = this.taskService.getTasks();
    this.events = this.eventService.getEvents();

    this.events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
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

  isFirstHourOfEvent(event: CalendarEvent, date: Date, hour: number): boolean {
    const eventStart = new Date(event.start);
    const eventDateStr = eventStart.toISOString().split('T')[0];
    const currentDateStr = date.toISOString().split('T')[0];
    

    if (eventDateStr !== currentDateStr) return true;
    

    return eventStart.getHours() === hour;
  }

  updateWeekDays(): void {

    const currentDayOfWeek = this.currentDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - currentDayOfWeek); // Go back to Sunday

    this.weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i); // Add i days to get each day of the week
      return {
        name: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][i],
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

    if (startDate.getMonth() === endDate.getMonth()) {
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

    for (let i = 0; i < startingDay; i++) {

        days.push(new Date(year, month, 1 - (startingDay - i)));
    }


    for (let i = 0; i < daysInMonth; i++) {
        days.push(new Date(year, month, i + 1));
    }


    const totalDaysDisplayed = days.length;

    const remainingSlots = (7 - (totalDaysDisplayed % 7)) % 7;
      for (let i = 0; i < remainingSlots; i++) {

          days.push(new Date(year, month + 1, i + 1));
        }


    return days;
  }


  getEventsForDate(date: Date): (CalendarEvent | Task)[] {
      const timedEvents = this.getTimedEventsForDate(date);
      const tasksWithDueDate = this.getTasksWithDueDateForDate(date);
      return [...timedEvents, ...tasksWithDueDate];
  }

  getTimedEventsForDate(date: Date): CalendarEvent[] {
      const dateStr = date.toISOString().split('T')[0];


    return this.events.filter(event => event.start && event.start.split('T')[0] === dateStr && event.start.includes('T'));
  }


  getTasksWithDueDateForDate(date: Date): Task[] {
    const dateStr = date.toISOString().split('T')[0];


    return this.tasks.filter(task => task.dueDate && task.dueDate.split('T')[0] === dateStr);
  }


  getEventsForHour(date: Date, hour: number): CalendarEvent[] {
    const dateStr = date.toISOString().split('T')[0];


    return this.events.filter(event => {
        if (!event.start || !event.end) return false; // Ensure start and end exist

        const eventStartDate = new Date(event.start);
        const eventEndDate = new Date(event.end);
        const eventDateStr = eventStartDate.toISOString().split('T')[0];



        return eventDateStr === dateStr && event.start.includes('T') && event.end.includes('T') &&
               eventStartDate.getHours() <= hour && // Event starts at or before the hour

               eventEndDate.getTime() > new Date(eventStartDate.getFullYear(), eventStartDate.getMonth(), eventStartDate.getDate(), hour + 1, 0).getTime();
    });
  }


  getEventTopPosition(event: CalendarEvent): string {
    const start = new Date(event.start);
    const minutes = start.getMinutes();

    return `${(minutes / 60) * 100}%`;
  }

  getEventHeight(event: CalendarEvent): string {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const durationInMinutes = (end.getTime() - start.getTime()) / (1000 * 60); // Duration in minutes

    return `${(durationInMinutes / 60) * 100}%`;
  }



  updateEventTimes(): void {

    const startTimeMinutes = this.startHour * 60 + this.startMinute;
    const endTimeMinutes = this.endHour * 60 + this.endMinute;



    const dateParts = this.eventDate.split('-').map(part => parseInt(part, 10));

    if (dateParts.some(isNaN)) {
      this.timeError = true; // Or handle invalid date input differently
      console.error("Invalid date parts:", this.eventDate);
      return;
    }
    const year = dateParts[0];
    const monthIndex = dateParts[1] - 1; // Month is 0-indexed
    const day = dateParts[2];

    const start = new Date(year, monthIndex, day, this.startHour, this.startMinute);

    const end = new Date(year, monthIndex, day, this.endHour, this.endMinute);


    if (end.getTime() <= start.getTime()) {
       end.setDate(end.getDate() + 1);
    }


    if (end.getTime() <= start.getTime()) {
        this.timeError = true;
    } else {
        this.timeError = false;
    }



    this.newEvent.start = start.toISOString();
    this.newEvent.end = end.toISOString();
  }

  openEventForm(date: Date, hour?: number): void {

    this.showTaskForm = false;

    this.selectedDate = date;

    this.eventDate = formatDate(date, 'yyyy-MM-dd', 'en-US');


    const clickedHour = hour !== undefined ? Math.floor(hour) : 9;
    const clickedMinute = hour !== undefined && hour % 1 !== 0 ? 30 : 0;

    this.startHour = clickedHour;
    this.startMinute = clickedMinute;


    const defaultEndTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), clickedHour, clickedMinute);
    defaultEndTime.setHours(defaultEndTime.getHours() + 1); // Add 1 hour

    this.endHour = defaultEndTime.getHours();
    this.endMinute = defaultEndTime.getMinutes();

    this.timeError = false; // Reset error on opening form


    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), this.startHour, this.startMinute);
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), this.endHour, this.endMinute);

     if (end.getTime() <= start.getTime()) {
        end.setDate(end.getDate() + 1);
     }

    this.newEvent = {
      id: 0,
      title: '',
      start: start.toISOString(),
      end: end.toISOString(),
      description: ''
    };
    this.showEventForm = true;
  }


  openTaskForm(date: Date): void {

    this.showEventForm = false;

    this.selectedDate = date;

    this.newTask = {
      title: '',
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


    alert('Para editar los detalles de una tarea (descripción, fecha, prioridad, etc.), por favor, ve a la página de "Mis Tareas". Aquí solo puedes verla.');


  }


  editEvent(event: CalendarEvent): void {

    this.showTaskForm = false;

    this.newEvent = { ...event };
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);


    this.eventDate = formatDate(startDate, 'yyyy-MM-dd', 'en-US');

    this.startHour = startDate.getHours();
    this.startMinute = startDate.getMinutes();
    this.endHour = endDate.getHours();
    this.endMinute = endDate.getMinutes();



    this.updateEventTimes();

    this.timeError = false; // Reset error on opening form
    this.showEventForm = true;
  }



  saveEvent(): void {

    if (!this.newEvent.title || !this.newEvent.title.trim()) {
        alert('El título del evento no puede estar vacío.');
        return;
    }
     this.newEvent.title = this.newEvent.title.trim(); // Trim title








    const dateParts = this.eventDate.split('-').map(part => parseInt(part, 10));
     if (dateParts.some(isNaN)) {
        this.timeError = true;
        console.error("Invalid date parts before saving:", this.eventDate);
        return;
     }
     const year = dateParts[0];
     const monthIndex = dateParts[1] - 1;
     const day = dateParts[2];

     const start = new Date(year, monthIndex, day, this.startHour, this.startMinute);
     const end = new Date(year, monthIndex, day, this.endHour, this.endMinute);


     if (end.getTime() <= start.getTime()) {
        end.setDate(end.getDate() + 1);
     }

     if (end.getTime() <= start.getTime()) {
        this.timeError = true;
         alert('La hora de fin debe ser posterior a la hora de inicio.'); // User feedback
        return;
     }
     this.timeError = false; // Reset in case it was true



    this.newEvent.start = start.toISOString();
    this.newEvent.end = end.toISOString();


    if (this.newEvent.id === 0) {
      this.eventService.addEvent(this.newEvent);
    } else {
      this.eventService.updateEvent(this.newEvent);
    }

    this.loadData(); // Reload data after saving events/tasks
    this.showEventForm = false;

      if (this.viewMode === 'week') {
          this.updateWeekDays();
      }
  }


  deleteEvent(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      this.eventService.deleteEvent(id);
      this.loadData(); // Reload data after deleting events/tasks
      this.showEventForm = false;

        if (this.viewMode === 'week') {
            this.updateWeekDays();
        }
    }
  }

  toggleViewMode(): void {

    this.showEventForm = false;
    this.showTaskForm = false;

    if (this.viewMode === 'month') {
      this.viewMode = 'week';

      this.currentDate = new Date();
      this.updateWeekDays(); // Update week days based on today
    } else { // This means current viewMode is 'week'
      this.viewMode = 'month';

      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    }

    this.selectedDate = null;
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
    this.selectedDate = null; // Clear selected date

    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1 // Always go to the 1st of the month
    );

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

  }


  prevWeek(): void {

    this.showEventForm = false;
    this.showTaskForm = false;
     this.selectedDate = null; // Clear selected date

      this.currentDate.setDate(this.currentDate.getDate() - 7);
      this.updateWeekDays();
  }

    nextWeek(): void {

    this.showEventForm = false;
    this.showTaskForm = false;
     this.selectedDate = null; // Clear selected date
      this.currentDate.setDate(this.currentDate.getDate() + 7);
      this.updateWeekDays();
  }


  closeDayView(): void {

    this.showEventForm = false;
    this.showTaskForm = false;

    if (this.selectedDate) {

      this.currentDate = new Date(this.selectedDate);

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

    if (!this.newTask.title || !this.newTask.title.trim() || !this.newTask.dueDate) {
        alert('El título de la tarea no puede estar vacío.');
        return;
    }
     this.newTask.title = this.newTask.title.trim();


    if (this.newTask.dueDate) {
      const taskToSave: Task = {
        id: 0,
        title: this.newTask.title,
        completed: false,
        createdDate: new Date().toISOString(),
        dueDate: this.newTask.dueDate


      };
      this.taskService.addTask(taskToSave);
      this.loadData();
      this.showTaskForm = false;
      this.newTask = { title: '', dueDate: '' };


    } else {

         alert('Error: No se pudo determinar la fecha de vencimiento para la tarea.');
         this.cancelTaskForm();
    }
  }

  cancelTaskForm(): void {
    this.showTaskForm = false;
    this.newTask = { title: '', dueDate: '' };


    if (this.viewMode !== 'day') {
      this.selectedDate = null;
    }
  }

  formatTime(hour: number, minute: number): string {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
}