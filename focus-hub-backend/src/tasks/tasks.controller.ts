import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TasksController {
  constructor(private readonly taskService: TasksService) {}

  @Post()
  create(@Request() req, @Body() createTaskDto: CreateTaskDto) {
    const userId = req.user.userId;
    return this.taskService.create(userId, createTaskDto);
  }

  @Get()
  findAll(@Request() req) {
    const userId = req.user.userId;
    return this.taskService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return this.taskService.findOne(+id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Request() req, @Body() updateTaskDto: UpdateTaskDto) {
    const userId = req.user.userId;
    return this.taskService.update(+id, userId, updateTaskDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string, 
    @Request() req,
    @Body('status') status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  ) {
    const userId = req.user.userId;
    return this.taskService.updateTaskStatus(+id, userId, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return this.taskService.remove(+id, userId);
  }
}
