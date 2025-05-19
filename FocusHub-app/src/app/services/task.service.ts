import { Injectable } from '@angular/core';
import { Task } from '../shared/interfaces/task.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  constructor() { 
    this.migrateTasks();
  }

  private migrateTasks(): void {
    const tasks = this.getTasks();
    if (tasks.length > 0 && typeof tasks[0].status === 'boolean') {
      const migratedTasks = tasks.map(task => ({
        ...task,
        status: task.status ? 'completed' : 'pending' as const // Usamos 'as const' para asegurar el tipo literal
      }));
      localStorage.setItem('tasks', JSON.stringify(migratedTasks));
    }
  }

  getTasks(): Task[] {
    const tasks = localStorage.getItem('tasks');
    return tasks ? JSON.parse(tasks) : [];
  }

  addTask(task: Omit<Task, 'id' | 'createdAt' | 'status'>): void {
    const tasks = this.getTasks();
    const newTask: Task = {
      ...task,
      id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
      createdAt: new Date().toISOString(),
      status: 'pending' as const // Estado inicial como tipo literal
    };
    tasks.push(newTask);
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  toggleComplete(id: number): void {
    const tasks = this.getTasks();
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        return { 
          ...task, 
          status: task.status === 'completed' ? 'pending' as const : 'completed' as const
        };
      }
      return task;
    });
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  }

  updateTask(updatedTask: Task): void {
    const tasks = this.getTasks();
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  }

  deleteTask(id: number): void {
    const tasks = this.getTasks();
    const updatedTasks = tasks.filter(task => task.id !== id);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  }

  duplicateTask(id: number): void {
    const tasks = this.getTasks();
    const taskToDuplicate = tasks.find(t => t.id === id);
    if (taskToDuplicate) {
      const newTask: Task = {
        ...taskToDuplicate,
        id: Math.max(...tasks.map(t => t.id)) + 1,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        user_id: null
      };
      tasks.push(newTask);
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
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

  // Método adicional para manejar el estado overdue si es necesario
  checkOverdueTasks(): void {
    const tasks = this.getTasks();
    const updatedTasks = tasks.map(task => {
      if ((task.status === 'pending' || task.status === 'in_progress') && 
          task.dueDate && new Date(task.dueDate) < new Date()) {
        return { ...task, status: 'overdue' };
      }
      return task;
    });
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  }
}