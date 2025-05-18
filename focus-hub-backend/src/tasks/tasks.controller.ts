import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './task.entity';

// Apply ValidationPipe to the entire controller
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    // The DTO includes userId, which is used by the service
    return this.tasksService.create(createTaskDto);
  }

  // Example: Get tasks for a specific user via query parameter
  // In a real app, userId would likely come from authentication/session
  @Get()
  findAll(@Query('userId', ParseIntPipe) userId: number): Promise<Task[]> {
    return this.tasksService.findAll(userId);
  }

  // Get a specific task by ID for a specific user
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number, // Assuming userId is passed via query for demo
  ): Promise<Task> {
    return this.tasksService.findOne(id, userId);
  }

  // Update a specific task by ID for a specific user
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @Query('userId', ParseIntPipe) userId: number, // Assuming userId is passed via query for demo
  ): Promise<Task> {
    // The updateTaskDto contains the fields to update
    return this.tasksService.update(id, updateTaskDto, userId);
  }

  // Delete a specific task by ID for a specific user
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number, // Assuming userId is passed via query for demo
  ): Promise<void> {
    return this.tasksService.remove(id, userId);
  }
}