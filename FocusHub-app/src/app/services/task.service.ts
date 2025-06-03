import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { Task } from '../shared/interfaces/task.interface';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly apiUrl = 'http://localhost:3000/tasks';
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);

  public tasks = signal<Task[]>([]);

  public readonly pendingTasks = computed(() =>
    this.tasks().filter(task =>
      task.status === 'pending' &&
      (!task.dueDate || new Date(task.dueDate) >= new Date())
    )
  );

  public readonly completedTasks = computed(() =>
    this.tasks().filter(task => task.status === 'completed')
  );

  public readonly expiredTasks = computed(() =>
    this.tasks().filter(task =>
      (task.status === 'pending' || task.status === 'in_progress' || task.status === 'overdue') &&
      task.dueDate &&
      new Date(task.dueDate) < new Date()
    )
  );

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

  addTask(task: Omit<Task, 'id' | 'createdAt' | 'status'>): void {
    this.http.post<Task>(this.apiUrl, task, this.getHeaders()).pipe(
      tap(newTask => this.tasks.set([newTask, ...this.tasks()]))
    ).subscribe();
  }

  updateTask(updatedTask: Task): void {
    this.http.patch<Task>(`${this.apiUrl}/${updatedTask.id}`, updatedTask, this.getHeaders()).pipe(
      tap(updated => {
        const updatedList = this.tasks().map(task =>
          task.id === updated.id ? updated : task
        );
        this.tasks.set(updatedList);
      })
    ).subscribe();
  }

  toggleComplete(task: Task): void {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    this.http.patch<Task>(`${this.apiUrl}/${task.id}/status`, { status: newStatus }, this.getHeaders()).pipe(
      tap(updated => {
        const updatedList = this.tasks().map(t =>
          t.id === updated.id ? updated : t
        );
        this.tasks.set(updatedList);
      })
    ).subscribe();
  }

  deleteTask(id: number): void {
    this.http.delete<void>(`${this.apiUrl}/${id}`, this.getHeaders()).pipe(
      tap(() => {
        const filtered = this.tasks().filter(task => task.id !== id);
        this.tasks.set(filtered);
      })
    ).subscribe();
  }

  duplicateTask(original: Task): void {
    const duplicated = {
      ...original,
      title: original.title + ' (Copia)',
      status: 'pending',
      dueDate: original.dueDate
    };

    delete (duplicated as any).id;
    delete (duplicated as any).createdAt;

    this.addTask(duplicated);
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
