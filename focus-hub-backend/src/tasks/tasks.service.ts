import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll(userId: number): Promise<Task[]> {
    return this.taskRepository.find({
      where: { user: { id: userId } },
      relations: ['user','category'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['category'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async create(userId: number, createTaskDto: CreateTaskDto): Promise<Task> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    const task = new Task();
    task.title = createTaskDto.title;
    task.description = createTaskDto.description;
    task.dueDate = createTaskDto.dueDate;
    task.priority = this.mapPriority(createTaskDto.priority || 'Medium');
    task.status = createTaskDto.status || 'pending';
    task.user = user;


    if (createTaskDto.categoryId) {
      console.log("intentado asignarle la categoria", createTaskDto.categoryId)
      const category = await this.categoryRepository.findOne({
        where: { id: createTaskDto.categoryId, user: { id: userId } },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${createTaskDto.categoryId} not found`);
      }

      task.category = category;
    }

    return this.taskRepository.save(task);
  }

  async update(id: number, userId: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id, userId);


    if (updateTaskDto.title !== undefined) task.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined) task.description = updateTaskDto.description;
    if (updateTaskDto.dueDate !== undefined) task.dueDate = updateTaskDto.dueDate;
    if (updateTaskDto.priority !== undefined) task.priority = this.mapPriority(updateTaskDto.priority);
    if (updateTaskDto.status !== undefined) task.status = updateTaskDto.status;


    if (updateTaskDto.categoryId !== undefined) {
      if (updateTaskDto.categoryId === null) {
        task.category = undefined;
      } else {
        const category = await this.categoryRepository.findOne({
          where: { id: updateTaskDto.categoryId, user: { id: userId } },
        });

        if (!category) {
          throw new NotFoundException(`Category with ID ${updateTaskDto.categoryId} not found`);
        }

        task.category = category;
      }
    }

    return this.taskRepository.save(task);
  }

  async remove(id: number, userId: number): Promise<void> {
    const task = await this.findOne(id, userId);
    await this.taskRepository.remove(task);
  }

  async findByCategory(userId: number, categoryId: number): Promise<Task[]> {
    return this.taskRepository.find({
      where: { user: { id: userId }, category: { id: categoryId } },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(userId: number, status: 'pending' | 'in_progress' | 'completed' | 'overdue'): Promise<Task[]> {
    return this.taskRepository.find({
      where: { user: { id: userId }, status },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByPriority(userId: number, priority: 'Alta' | 'Media' | 'Baja'): Promise<Task[]> {
    const mappedPriority = this.mapPriority(priority);
    return this.taskRepository.find({
      where: { user: { id: userId }, priority: mappedPriority },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }


  async updateTaskStatus(id: number, userId: number, status: 'pending' | 'in_progress' | 'completed' | 'overdue'): Promise<Task> {
    const task = await this.findOne(id, userId);
    task.status = status;
    return this.taskRepository.save(task);
  }

  private mapPriority(priority: string): 'Low' | 'Medium' | 'High' {
    const mapping: Record<string, 'Low' | 'Medium' | 'High'> = {
      'Baja': 'Low',
      'Media': 'Medium',
      'Alta': 'High'
    };

    return mapping[priority] ?? 'Medium';
  }
}
