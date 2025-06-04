import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,Request } from '@nestjs/common';
import { ProductivityService } from './productivity.service';
import { CreateTechniqueDto } from './dto/create-technique.dto';
import { UpdateTechniqueDto } from './dto/update-technique.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreateFocusSessionDto } from './dto/create-focus-session.dto';
import { UpdateFocusSessionDto } from './dto/update-focus-session.dto';
import { CreateFocusSessionTaskDto } from './dto/create-focus-session-task.dto';
import { UpdateFocusSessionTaskDto } from './dto/update-focus-session-task.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@ApiTags('productivity')
@Controller('productivity')
export class ProductivityController {
  constructor(private readonly productivityService: ProductivityService) {}


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


  @Get('techniques/:id') // CAMBIADO: :name a :id
  @ApiOperation({ summary: 'Get a technique by ID' }) // CAMBIADO: summary
  @ApiResponse({ status: 200, description: 'Return the technique' })
  @ApiResponse({ status: 404, description: 'Technique not found' })
  findOneTechnique(@Param('id') id: string, @Query('userId') userId: number) { // CAMBIADO: name a id
    return this.productivityService.findOneTechniqueById(+id, userId); // CAMBIADO: findOneTechniqueByName a findOneTechniqueById
  }

  @Patch('techniques/:id') // CAMBIADO: :name a :id
  @ApiOperation({ summary: 'Update a technique by ID' }) // CAMBIADO: summary
  @ApiResponse({ status: 200, description: 'Technique updated successfully' })
  @ApiResponse({ status: 404, description: 'Technique not found' })
  updateTechnique(
    @Param('id') id: string, // CAMBIADO: name a id
    @Body() updateTechniqueDto: UpdateTechniqueDto,
    @Query('userId') userId: number
  ) {
    return this.productivityService.updateTechniqueById(+id, userId, updateTechniqueDto); // CAMBIADO: updateTechniqueByName a updateTechniqueById
  }

  @Delete('techniques/:id') // CAMBIADO: :name a :id
  @ApiOperation({ summary: 'Delete a technique by ID' }) // CAMBIADO: summary
  @ApiResponse({ status: 200, description: 'Technique deleted successfully' })
  @ApiResponse({ status: 404, description: 'Technique not found' })
  removeTechnique(@Param('id') id: string, @Query('userId') userId: number) { // CAMBIADO: name a id
    return this.productivityService.removeTechniqueById(+id, userId); // CAMBIADO: removeTechniqueByName a removeTechniqueById
  }

  @Post('focus-sessions')
  @ApiOperation({ summary: 'Create a new focus session' })
  createFocusSession(@Body() createFocusSessionDto: Omit<CreateFocusSessionDto, 'userId'>, @Request() req) { // Omitimos userId del DTO aquí
    const userId = req.user.userId; // Obtienes userId del token
    return this.productivityService.createFocusSession({ ...createFocusSessionDto, userId }); // Lo pasas al servicio
  }


  @Get('focus-sessions')
  @ApiOperation({ summary: 'Get all focus sessions for a user' })
  findAllFocusSessions(@Request() req) { // Quitas @Query('userId') userId: number
    const userId = req.user.userId; // Obtienes userId del token
    return this.productivityService.findAllFocusSessions(userId);
  }


  @Get('focus-sessions/:id')
  @ApiOperation({ summary: 'Get a focus session by ID' })
  findOneFocusSession(@Param('id') id: string, @Request() req) { // Quitas @Query('userId') userId: number
    const userId = req.user.userId; // Obtienes userId del token
    return this.productivityService.findOneFocusSession(+id, userId);
  }
  
  @Patch('focus-sessions/:id')
  @ApiOperation({ summary: 'Update a focus session' })
  @ApiResponse({ status: 200, description: 'Focus session updated successfully' })
  @ApiResponse({ status: 404, description: 'Focus session not found' })
  updateFocusSession( @Param('id') id: string, @Body() updateFocusSessionDto: UpdateFocusSessionDto, @Request() req) {
    const userId = req.user.userId; // Extraes el userId del token
    // Pasas el userId al servicio, que es quien lo necesita
    return this.productivityService.updateFocusSession(+id, userId, updateFocusSessionDto);
  }

  @Delete('focus-sessions/:id')
  @ApiOperation({ summary: 'Delete a focus session' })
  @ApiResponse({ status: 200, description: 'Focus session deleted successfully' })
  @ApiResponse({ status: 404, description: 'Focus session not found' })
  removeFocusSession( @Param('id') id: string, @Request() req) {
    const userId = req.user.userId; // Extraes el userId del token
    // Pasas el userId al servicio, que es quien lo necesita
    return this.productivityService.removeFocusSession(+id, userId);
  }

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

  @Get('stats')
  async getUserStats(@Request() req) {
    const userId = req.user.userId;
    return this.productivityService.getUserStats(userId)
  }
}