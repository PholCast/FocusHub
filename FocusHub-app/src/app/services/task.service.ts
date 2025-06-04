// src/app/services/task.service.ts
import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { Task } from '../shared/interfaces/task.interface';
import { TokenService } from './token.service';
import { Observable, interval, startWith } from 'rxjs'; // Importar interval y startWith

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly apiUrl = 'http://backend:3000/tasks';
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);

  public tasks = signal<Task[]>([]);

  // --- NUEVA SEÑAL PARA EL TIEMPO ACTUAL ---
  // Se actualiza periódicamente para forzar la reevaluación de señales computadas que dependan del tiempo.
  public nowSignal = signal(new Date());

  // Ahora, las señales computadas dependerán de `nowSignal()`
  public readonly pendingTasks = computed(() => {
    const now = this.nowSignal(); // Añadir `now` como dependencia
    return this.tasks().filter(task =>
      task.status === 'pending' &&
      (!task.dueDate || new Date(task.dueDate) >= now) // Comparar contra la señal `now`
    );
  });

  public readonly completedTasks = computed(() =>
    this.tasks().filter(task => task.status === 'completed')
  );

  public readonly expiredTasks = computed(() => {
    const now = this.nowSignal(); // Añadir `now` como dependencia
    return this.tasks().filter(task =>
      (task.status === 'pending' || task.status === 'in_progress') && // Solo pendientes o en progreso pueden expirar
      task.dueDate &&
      new Date(task.dueDate) < now
    );
  });

  // --- Constructor para inicializar el intervalo del tiempo actual ---
  constructor() {
    // Actualiza la señal `nowSignal` cada minuto
    interval(60 * 1000) // Cada minuto
      .pipe(startWith(0)) // Emite un valor inicial al suscribirse para que se calcule al inicio
      .subscribe(() => {
        this.nowSignal.set(new Date());
      });

    // Carga las tareas al inicializar el servicio (o puedes llamarlo desde ngOnInit del componente principal)
    // this.loadTasks(); // Depende de tu flujo de inicialización.
  }

  private getHeaders() {
    const token = this.tokenService.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  loadTasks(): void {
    this.http.get<Task[]>(this.apiUrl, this.getHeaders()).pipe(
      map(tasks => tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())),
      tap(sorted => this.tasks.set(sorted))
    ).subscribe();
  }

  addTask(task: Omit<Task, 'id' | 'createdAt' | 'status'>): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task, this.getHeaders()).pipe(
      tap(newTask => {
        this.tasks.update(currentTasks => [newTask, ...currentTasks]);
      })
    );
  }

  updateTask(updatedTask: Task): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${updatedTask.id}`, updatedTask, this.getHeaders()).pipe(
      tap(updated => {
        this.tasks.update(currentTasks =>
          currentTasks.map(task => task.id === updated.id ? updated : task)
        );
      })
    );
  }

  toggleComplete(task: Task): Observable<Task> {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    return this.http.patch<Task>(`${this.apiUrl}/${task.id}/status`, { status: newStatus }, this.getHeaders()).pipe(
      tap(updated => {
        this.tasks.update(currentTasks =>
          currentTasks.map(t => t.id === updated.id ? updated : t)
        );
      })
    );
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getHeaders()).pipe(
      tap(() => {
        this.tasks.update(currentTasks => currentTasks.filter(task => task.id !== id));
      })
    );
  }

  duplicateTask(original: Task): Observable<Task> {
    const duplicated = {
      ...original,
      title: original.title + ' (Copia)',
      status: 'pending',
      dueDate: original.dueDate
    };
    delete (duplicated as any).id;
    delete (duplicated as any).createdAt;
    return this.addTask(duplicated);
  }

  // -- Categorías y proyectos (persisten localmente) --
  getCategories(): string[] {
    const categories = localStorage.getItem('categories');
    return categories ? JSON.parse(categories) : ['Personal', 'Trabajo', 'Estudio'];
  }

  addCategory(category: string): void {
    const categories = this.getCategories();
    if (!categories.includes(category)) {
      categories.push(category);
      localStorage.setItem('categories', JSON.stringify(categories));
    }
  }

  getProjects(): string[] {
    const projects = localStorage.getItem('projects');
    return projects ? JSON.parse(projects) : ['Proyecto 1', 'Proyecto 2'];
  }

  addProject(project: string): void {
    const projects = this.getProjects();
    if (!projects.includes(project)) {
      projects.push(project);
      localStorage.setItem('projects', JSON.stringify(projects));
    }
  }
}