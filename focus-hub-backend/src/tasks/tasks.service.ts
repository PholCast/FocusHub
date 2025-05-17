import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { User } from '../users/user.entity'; // Import User entity for relationship handling
import { Category } from '../categories/category.entity'; // Import Category entity for relationship handling

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const { title, description, dueDate, priority, status, userId, categoryId } = createTaskDto;

    // Create a new task entity instance
    const task = this.tasksRepository.create({
      title,
      description,
      // Convert dueDate string to Date object if provided, otherwise undefined
      dueDate: dueDate ? new Date(dueDate) : undefined, // Use undefined for nullable columns
      priority,
      status,
      // Assign the user relationship using just the ID
      // TypeORM can create the relationship with a partial object containing only the ID
      user: { id: userId } as User,
    });

    // Assign the category relationship if categoryId is provided
    if (categoryId !== undefined) { // Check if the field was sent at all in the DTO
        if (categoryId !== null) {
             // Assign the category relationship using just the ID
             // Check if the category exists (optional but recommended in a real app)
             task.category = { id: categoryId } as Category;
        } else {
            // Explicitly setting category to null in the DTO maps to undefined in the entity
            task.category = undefined; // Use undefined for nullable relationships
        }
    }

    // Save the task to the database
    try {
        return await this.tasksRepository.save(task);
    } catch (error) {
        console.error('Error creating task:', error);
        // Handle potential errors, e.g., user or category not found, DB constraints
        throw new BadRequestException('Could not create task. Ensure user and category IDs are valid and data is correctly formatted.');
    }
  }

  async findAll(userId: number): Promise<Task[]> {
    // Find all tasks belonging to a specific user, loading the category relationship
    return this.tasksRepository.find({
      where: { user: { id: userId } },
      relations: ['category'], // Eager load the category relationship if needed by the frontend
    });
  }

  async findOne(id: number, userId: number): Promise<Task> {
    // Find a task by ID that belongs to a specific user
    const task = await this.tasksRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['category'], // Eager load category
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found for user ${userId}`);
    }
    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, userId: number): Promise<Task> {
    // Find the existing task for the user first
    // This also checks if the task exists and belongs to the user
    const task = await this.findOne(id, userId);

    // Merge the updates from the DTO into the found task entity
    // merge handles most simple property updates
    this.tasksRepository.merge(task, updateTaskDto);

    // Handle specific conversions/assignments not automatically handled by merge
    // like string date to Date object and nullable relationship
    if (updateTaskDto.dueDate !== undefined) {
        // Convert dueDate string to Date object if provided, otherwise undefined
        task.dueDate = updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : undefined; // Use undefined for nullable columns
    }

    // Handle category assignment or setting to undefined
    if (updateTaskDto.categoryId !== undefined) { // Check if the field was sent at all in the DTO
        if (updateTaskDto.categoryId !== null) {
             // Assign the category relationship using just the ID
             // Check if the category exists (optional but recommended in a real app)
             task.category = { id: updateTaskDto.categoryId } as Category;
        } else {
            // Explicitly set category to null in the DTO maps to undefined in the entity
            task.category = undefined; // Use undefined for nullable relationships
        }
    }

    // Save the updated task
    try {
        return await this.tasksRepository.save(task);
    } catch (error) {
         console.error('Error updating task:', error);
         // Handle potential foreign key errors if an invalid categoryId is provided
         throw new BadRequestException('Could not update task. Ensure category ID is valid and data is correctly formatted.');
    }
  }

  async remove(id: number, userId: number): Promise<void> {
    // Find the task first to ensure it exists and belongs to the user
    // findOne throws NotFoundException if not found/not user's
    const task = await this.findOne(id, userId);

    // Remove the task
    await this.tasksRepository.remove(task);

    // Alternative using delete result (less common if you already fetched):
    // const result = await this.tasksRepository.delete({ id, user: { id: userId } });
    // if (result.affected === 0) {
    //     // This case should ideally not be reached if findOne passed, but good as a fallback
    //     throw new NotFoundException(`Task with ID ${id} not found for user ${userId}`);
    // }
  }
}