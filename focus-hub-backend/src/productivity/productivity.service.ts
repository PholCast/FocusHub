import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Technique } from './entities/technique.entity';
import { User } from '../users/user.entity';
import { CreateTechniqueDto } from './dto/create-technique.dto';
import { UpdateTechniqueDto } from './dto/update-technique.dto';
import { Task } from '../tasks/task.entity';
import { FocusSession } from './entities/focus-session.entity';
import { CreateFocusSessionDto } from './dto/create-focus-session.dto';
import { UpdateFocusSessionDto } from './dto/update-focus-session.dto';

import { FocusSessionTask } from './entities/focus-session-task.entity';
import { CreateFocusSessionTaskDto } from './dto/create-focus-session-task.dto';
import { UpdateFocusSessionTaskDto } from './dto/update-focus-session-task.dto';

@Injectable()
export class ProductivityService {
  constructor(
    @InjectRepository(Technique) private readonly techniqueRepository: Repository<Technique>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(FocusSession) private readonly focusSessionRepository: Repository<FocusSession>,
    @InjectRepository(FocusSessionTask) private readonly focusSessionTaskRepository: Repository<FocusSessionTask>,
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
  ) {}


  async createTechnique(userId: number, createTechniqueDto: CreateTechniqueDto): Promise<Technique> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const name = createTechniqueDto.name.toLowerCase();
    const existingTechnique = await this.techniqueRepository.findOne({
      where: { name, user: { id: userId } },
    });
    if (existingTechnique) {
      throw new BadRequestException(`Technique with name '${name}' already exists for this user`);
    }

    const technique = this.techniqueRepository.create({ ...createTechniqueDto, name, user });
    return this.techniqueRepository.save(technique);
  }

  async findAllTechniques(userId: number): Promise<Technique[]> {
    return this.techniqueRepository.find({ where: { user: { id: userId } }, order: { name: 'ASC' } });
  }

  async findAllTechniquesForAllUsers(): Promise<Technique[]> {
    return this.techniqueRepository.find({
        where: { user: IsNull() },
        order: { name: 'ASC' },
    });
  }

  // CAMBIADO: de findOneTechniqueByName a findOneTechniqueById
  async findOneTechniqueById(id: number, userId: number): Promise<Technique> {
    const technique = await this.techniqueRepository.findOne({
      where: { id: id, user: { id: userId } },
    });
    if (!technique) throw new NotFoundException(`Technique with ID ${id} not found for user ${userId}`);
    return technique;
  }

  // CAMBIADO: de updateTechniqueByName a updateTechniqueById
  async updateTechniqueById(id: number, userId: number, updateTechniqueDto: UpdateTechniqueDto): Promise<Technique> {
    const technique = await this.findOneTechniqueById(id, userId); // Usa el nuevo método findById

    // Si el nombre se está actualizando, verificar unicidad para el mismo usuario
    if (updateTechniqueDto.name && updateTechniqueDto.name !== technique.name) {
      const existingTechniqueWithNewName = await this.techniqueRepository.findOne({
        where: { name: updateTechniqueDto.name, user: { id: userId } },
      });
      if (existingTechniqueWithNewName) {
        throw new BadRequestException(`Technique with name '${updateTechniqueDto.name}' already exists for this user`);
      }
    }

    // Convertir duraciones de minutos a segundos antes de asignar (si aplica)
    if (updateTechniqueDto.workDuration !== undefined) {
      updateTechniqueDto.workDuration = updateTechniqueDto.workDuration * 60;
      delete updateTechniqueDto.workDuration; // Eliminar la propiedad original para evitar conflicto
    }
    if (updateTechniqueDto.breakDuration !== undefined) {
      updateTechniqueDto.breakDuration = updateTechniqueDto.breakDuration * 60;
      delete updateTechniqueDto.breakDuration;
    }
    if (updateTechniqueDto.longBreakDuration !== undefined) {
      updateTechniqueDto.longBreakDuration = updateTechniqueDto.longBreakDuration * 60;
      delete updateTechniqueDto.longBreakDuration;
    }

    Object.assign(technique, updateTechniqueDto);
    return this.techniqueRepository.save(technique);
  }

  async removeTechniqueById(id: number, userId: number): Promise<void> {
    const technique = await this.findOneTechniqueById(id, userId); // Usa el nuevo método findById
    await this.techniqueRepository.remove(technique);
  }


  async createFocusSession(createFocusSessionDto: CreateFocusSessionDto): Promise<FocusSession> {
    const { userId, techniqueId, status } = createFocusSessionDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const technique = await this.techniqueRepository.findOne({
      where: [
            { id: techniqueId, user: { id: userId } },
            { id: techniqueId, user: IsNull() },
      ],
    });
    if (!technique) throw new NotFoundException(`Technique with ID ${techniqueId} not found for this user`);

    const focusSession = this.focusSessionRepository.create({
      user,
      technique,
      status,
    });

    return this.focusSessionRepository.save(focusSession);
  }

  async findAllFocusSessions(userId: number): Promise<FocusSession[]> {
    return this.focusSessionRepository.find({
      where: { user: { id: userId } },
      relations: ['technique', 'focusSessionTasks'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneFocusSession(id: number, userId: number): Promise<FocusSession> {
    const focusSession = await this.focusSessionRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['technique', 'focusSessionTasks'],
    });
    if (!focusSession) throw new NotFoundException(`FocusSession with ID ${id} not found`);
    return focusSession;
  }

  async updateFocusSession(id: number, userId: number, updateFocusSessionDto: UpdateFocusSessionDto): Promise<FocusSession> {
    const focusSession = await this.findOneFocusSession(id, userId);
    Object.assign(focusSession, updateFocusSessionDto);
    return this.focusSessionRepository.save(focusSession);
  }

  async removeFocusSession(id: number, userId: number): Promise<void> {
    const focusSession = await this.findOneFocusSession(id, userId);
    await this.focusSessionRepository.remove(focusSession);



  }

  async createFocusSessionTask(createFocusSessionTaskDto: CreateFocusSessionTaskDto): Promise<FocusSessionTask> {
    const { focusSessionId, taskId } = createFocusSessionTaskDto;


    const focusSession = await this.focusSessionRepository.findOne({
      where: { id: focusSessionId },
      relations: ['user'],
    });
    if (!focusSession) {
      throw new NotFoundException(`Focus session with ID ${focusSessionId} not found`);
    }


    const task = await this.taskRepository.findOne({
      where: { id: taskId, user: { id: focusSession.user.id } },
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found for this user`);
    }


    const existingTask = await this.focusSessionTaskRepository.findOne({
      where: { focusSession: { id: focusSessionId }, task: { id: taskId } },
    });
    if (existingTask) {
      throw new BadRequestException(`Task with ID ${taskId} is already linked to this focus session`);
    }


    const focusSessionTask = this.focusSessionTaskRepository.create({
      focusSession,
      task,
    });

    return this.focusSessionTaskRepository.save(focusSessionTask);
  }

  async findAllFocusSessionTasks(): Promise<FocusSessionTask[]> {
    return this.focusSessionTaskRepository.find({ relations: ['focusSession', 'task'] });
  }

  async findOneFocusSessionTask(id: number): Promise<FocusSessionTask> {
    const focusSessionTask = await this.focusSessionTaskRepository.findOne({
      where: { id },
      relations: ['focusSession', 'task'],
    });
    if (!focusSessionTask) throw new NotFoundException(`Focus session task with ID ${id} not found`);
    return focusSessionTask;
  }

  async updateFocusSessionTask(id: number, updateFocusSessionTaskDto: UpdateFocusSessionTaskDto): Promise<FocusSessionTask> {
    const focusSessionTask = await this.findOneFocusSessionTask(id);
    Object.assign(focusSessionTask, updateFocusSessionTaskDto);
    return this.focusSessionTaskRepository.save(focusSessionTask);
  }

  async removeFocusSessionTask(id: number): Promise<void> {
    const focusSessionTask = await this.findOneFocusSessionTask(id);
    await this.focusSessionTaskRepository.remove(focusSessionTask);
  }

  async getUserStats(userId: number): Promise<FocusSession[]> {
    // Busca sesiones con las relaciones: tareas, técnicas y usuario
    const sessions = await this.focusSessionRepository.find({
      where: { user: { id: userId } },
      relations: [
        'focusSessionTasks',
        'focusSessionTasks.task',
        'technique',
      ],
      order: { createdAt: 'DESC' }, 
    });

    if (!sessions || sessions.length === 0) {
      throw new NotFoundException('No focus sessions found for this user.');
    }

    return sessions;
  }
}
