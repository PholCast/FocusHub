import { Injectable } from '@angular/core';
import { Task } from '../shared/interfaces/task.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  constructor() { }

  getTasks(): Task[] {
    const tasks = localStorage.getItem('tasks');
    return tasks ? JSON.parse(tasks) : [];
  }

  addTask(task: Task): void {
    const tasks = this.getTasks();
    task.id = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    task.createdAt = new Date().toISOString();
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  toggleComplete(id: number): void {
    const tasks = this.getTasks();
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        return { ...task, status: !task.status };
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
      const newTask = {
        ...taskToDuplicate,
        id: Math.max(...tasks.map(t => t.id)) + 1,
        status: false,
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
}