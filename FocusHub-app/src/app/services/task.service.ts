import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
      tap(newTask => this.tasks.set([newTask, ...this.tasks()]))
    );
  }

  updateTask(updatedTask: Task): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${updatedTask.id}`, updatedTask, this.getHeaders()).pipe(
      tap(updated => {
        const updatedList = this.tasks().map(task =>
          task.id === updated.id ? updated : task
        );
        this.tasks.set(updatedList);
      })
    );
  }

  toggleComplete(task: Task): Observable<Task> {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    return this.http.patch<Task>(`${this.apiUrl}/${task.id}/status`, { status: newStatus }, this.getHeaders()).pipe(
      tap(updated => {
        const updatedList = this.tasks().map(t =>
          t.id === updated.id ? updated : t
        );
        this.tasks.set(updatedList);
      })
    );
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getHeaders()).pipe(
      tap(() => {
        const filtered = this.tasks().filter(task => task.id !== id);
        this.tasks.set(filtered);
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
