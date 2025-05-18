import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ProductivityService } from './productivity.service';
import { CreateTechniqueDto } from './dto/create-technique.dto';
import { UpdateTechniqueDto } from './dto/update-technique.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreateFocusSessionDto } from './dto/create-focus-session.dto';
import { UpdateFocusSessionDto } from './dto/update-focus-session.dto';
import { CreateFocusSessionTaskDto } from './dto/create-focus-session-task.dto';
import { UpdateFocusSessionTaskDto } from './dto/update-focus-session-task.dto';

@ApiTags('productivity')
@Controller('productivity')
export class ProductivityController {
  constructor(private readonly productivityService: ProductivityService) {}

  //Techniques
  @Post('techniques')
  @ApiOperation({ summary: 'Create a new technique' })
  @ApiResponse({ status: 201, description: 'Technique created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  createTechnique(@Body() createTechniqueDto: CreateTechniqueDto, @Query('userId') userId: number) {
    return this.productivityService.createTechnique(userId, createTechniqueDto);
  }

  @Get('techniques')
  @ApiOperation({ summary: 'Get all techniques for a user' })
  @ApiResponse({ status: 200, description: 'Return all techniques' })
  findAllTechniques(@Query('userId') userId: number) {
    return this.productivityService.findAllTechniques(userId);
  }

  @Get('techniques/global')
  @ApiOperation({ summary: 'Get all techniques without a specific user' })
  @ApiResponse({ status: 200, description: 'Return all global techniques' })
  findAllTechniquesForAllUsers() {
    return this.productivityService.findAllTechniquesForAllUsers();
 }


  @Get('techniques/:id')
  @ApiOperation({ summary: 'Get a technique by ID' })
  @ApiResponse({ status: 200, description: 'Return the technique' })
  @ApiResponse({ status: 404, description: 'Technique not found' })
  findOneTechnique(@Param('id') id: string, @Query('userId') userId: number) {
    return this.productivityService.findOneTechnique(+id, userId);
  }

  @Patch('techniques/:id')
  @ApiOperation({ summary: 'Update a technique' })
  @ApiResponse({ status: 200, description: 'Technique updated successfully' })
  @ApiResponse({ status: 404, description: 'Technique not found' })
  updateTechnique(@Param('id') id: string, @Body() updateTechniqueDto: UpdateTechniqueDto, @Query('userId') userId: number) {
    return this.productivityService.updateTechnique(+id, userId, updateTechniqueDto);
  }

  @Delete('techniques/:id')
  @ApiOperation({ summary: 'Delete a technique' })
  @ApiResponse({ status: 200, description: 'Technique deleted successfully' })
  @ApiResponse({ status: 404, description: 'Technique not found' })
  removeTechnique(@Param('id') id: string, @Query('userId') userId: number) {
    return this.productivityService.removeTechnique(+id, userId);
  }



  //focus_sessions
  @Post('focus-sessions')
  @ApiOperation({ summary: 'Create a new focus session' })
  @ApiResponse({ status: 201, description: 'Focus session created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User or Technique not found' })
  createFocusSession(@Body() createFocusSessionDto: CreateFocusSessionDto) {
    return this.productivityService.createFocusSession(createFocusSessionDto);
  }

  @Get('focus-sessions')
  @ApiOperation({ summary: 'Get all focus sessions for a user' })
  @ApiResponse({ status: 200, description: 'Return all focus sessions' })
  findAllFocusSessions(@Query('userId') userId: number) {
    return this.productivityService.findAllFocusSessions(userId);
  }

  @Get('focus-sessions/:id')
  @ApiOperation({ summary: 'Get a focus session by ID' })
  @ApiResponse({ status: 200, description: 'Return the focus session' })
  @ApiResponse({ status: 404, description: 'Focus session not found' })
  findOneFocusSession(@Param('id') id: string, @Query('userId') userId: number) {
    return this.productivityService.findOneFocusSession(+id, userId);
  }

  @Patch('focus-sessions/:id')
  @ApiOperation({ summary: 'Update a focus session' })
  @ApiResponse({ status: 200, description: 'Focus session updated successfully' })
  @ApiResponse({ status: 404, description: 'Focus session not found' })
  updateFocusSession(@Param('id') id: string, @Body() updateFocusSessionDto: UpdateFocusSessionDto, @Query('userId') userId: number) {
    return this.productivityService.updateFocusSession(+id, userId, updateFocusSessionDto);
  }

  @Delete('focus-sessions/:id')
  @ApiOperation({ summary: 'Delete a focus session' })
  @ApiResponse({ status: 200, description: 'Focus session deleted successfully' })
  @ApiResponse({ status: 404, description: 'Focus session not found' })
  removeFocusSession(@Param('id') id: string, @Query('userId') userId: number) {
    return this.productivityService.removeFocusSession(+id, userId);
  }

  //focus_sessions_tasks

  @Post('focus-session-tasks')
  @ApiOperation({ summary: 'Create a new focus session task' })
  @ApiResponse({ status: 201, description: 'Focus session task created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Focus session or task not found' })
  createFocusSessionTask(@Body() createFocusSessionTaskDto: CreateFocusSessionTaskDto) {
    return this.productivityService.createFocusSessionTask(createFocusSessionTaskDto);
  }

  @Get('focus-session-tasks')
  @ApiOperation({ summary: 'Get all focus session tasks' })
  @ApiResponse({ status: 200, description: 'Return all focus session tasks' })
  findAllFocusSessionTasks() {
    return this.productivityService.findAllFocusSessionTasks();
  }

  @Get('focus-session-tasks/:id')
  @ApiOperation({ summary: 'Get a focus session task by ID' })
  @ApiResponse({ status: 200, description: 'Return the focus session task' })
  @ApiResponse({ status: 404, description: 'Focus session task not found' })
  findOneFocusSessionTask(@Param('id') id: string) {
    return this.productivityService.findOneFocusSessionTask(+id);
  }

  @Patch('focus-session-tasks/:id')
  @ApiOperation({ summary: 'Update a focus session task' })
  @ApiResponse({ status: 200, description: 'Focus session task updated successfully' })
  @ApiResponse({ status: 404, description: 'Focus session task not found' })
  updateFocusSessionTask(@Param('id') id: string, @Body() updateFocusSessionTaskDto: UpdateFocusSessionTaskDto) {
    return this.productivityService.updateFocusSessionTask(+id, updateFocusSessionTaskDto);
  }

  @Delete('focus-session-tasks/:id')
  @ApiOperation({ summary: 'Delete a focus session task' })
  @ApiResponse({ status: 200, description: 'Focus session task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Focus session task not found' })
  removeFocusSessionTask(@Param('id') id: string) {
    return this.productivityService.removeFocusSessionTask(+id);
  }

}