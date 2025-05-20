import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Task } from '../shared/interfaces/task.interface';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:3000/tasks';
  private _tasks$ = new BehaviorSubject<Task[]>([]);
  public tasks$ = this._tasks$.asObservable();

  constructor(private http: HttpClient) {
    this.loadTasks();
  }

  
  private loadTasks(): void {
    this.http.get<Task[]>(this.apiUrl).subscribe({
      next: tasks => {
        tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this._tasks$.next(tasks);
      },
      error: err => console.error('Error cargando tareas', err)
    });
  }

  
  getTasks(): Task[] {
    return this._tasks$.getValue();
  }

  
  addTask(task: Omit<Task, 'id' | 'createdAt' | 'status'>): void {
    this.http.post<Task>(this.apiUrl, task).pipe(
      tap(() => this.loadTasks())
    ).subscribe();
  }

  
  updateTask(updatedTask: Task): void {
    this.http.patch<Task>(`${this.apiUrl}/${updatedTask.id}`, updatedTask).pipe(
      tap(() => this.loadTasks())
    ).subscribe();
  }

  
  toggleComplete(id: number): void {
    const task = this.getTasks().find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    this.http.patch(`${this.apiUrl}/${id}/status`, { status: newStatus }).pipe(
      tap(() => this.loadTasks())
    ).subscribe();
  }

  
  deleteTask(id: number): void {
    this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadTasks())
    ).subscribe();
  }

  
  duplicateTask(id: number): void {
    const original = this.getTasks().find(t => t.id === id);
    if (!original) return;

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

  
  checkOverdueTasks(): void {
    const updated: Task[] = this.getTasks().map(task => {
      if ((task.status === 'pending' || task.status === 'in_progress') &&
          task.dueDate && new Date(task.dueDate) < new Date()) {
        return { ...task, status: 'overdue' as const }; 
      }
      return task;
    });

    this._tasks$.next(updated);
  }

}
