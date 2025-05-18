import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly taskService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User or category not found' })
  create(@Body() createTaskDto: CreateTaskDto, @Query('userId') userId: number = 1) {
    return this.taskService.create(userId, createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks for the current user' })
  @ApiResponse({ status: 200, description: 'Return all tasks' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'in_progress', 'completed', 'overdue'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['low', 'medium', 'high'] })
  findAll(
    @Query('userId') userId: number = 1,
    @Query('categoryId') categoryId?: number,
    @Query('status') status?: 'pending' | 'in_progress' | 'completed' | 'overdue',
    @Query('priority') priority?: 'low' | 'medium' | 'high',
  ) {
    if (categoryId) {
      return this.taskService.findByCategory(userId, categoryId);
    }
    
    if (status) {
      return this.taskService.findByStatus(userId, status);
    }
    
    if (priority) {
      return this.taskService.findByPriority(userId, priority);
    }
    
    return this.taskService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiResponse({ status: 200, description: 'Return the task' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  findOne(@Param('id') id: string, @Query('userId') userId: number = 1) {
    return this.taskService.findOne(+id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  update(
    @Param('id') id: string, 
    @Body() updateTaskDto: UpdateTaskDto, 
    @Query('userId') userId: number = 1
  ) {
    return this.taskService.update(+id, userId, updateTaskDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update task status' })
  @ApiResponse({ status: 200, description: 'Task status updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  updateStatus(
    @Param('id') id: string, 
    @Body('status') status: 'pending' | 'in_progress' | 'completed' | 'overdue',
    @Query('userId') userId: number = 1
  ) {
    return this.taskService.updateTaskStatus(+id, userId, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  remove(@Param('id') id: string, @Query('userId') userId: number = 1) {
    return this.taskService.remove(+id, userId);
  }
}