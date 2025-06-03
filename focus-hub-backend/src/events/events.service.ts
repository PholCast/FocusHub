import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './event.entity';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  private mapPriority(priority: string): 'Low' | 'Medium' | 'High' {
    const mapping: Record<string, 'Low' | 'Medium' | 'High'> = {
      'Baja': 'Low',
      'Media': 'Medium',
      'Alta': 'High'
    };

    const mapped = mapping[priority];
    if (!mapped) {
      throw new BadRequestException(`Prioridad inválida: ${priority}`);
    }

    return mapped;
  }

  async create(dto: CreateEventDto, userId: number): Promise<Event> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    let category: Category | null | undefined = undefined;
    if ('categoryId' in dto) {
      if (dto.categoryId === null) {
        category = null;
      } else if (dto.categoryId !== undefined) {
        if (typeof dto.categoryId !== 'number') {
          throw new BadRequestException('categoryId must be a number');
        }
        category = await this.categoryRepository.findOneBy({ id: dto.categoryId });
        if (!category) throw new NotFoundException('Category not found');
      }
    }

    const start = new Date(dto.startTime);
    const end = dto.endTime ? new Date(dto.endTime) : undefined;

    if (end && end < start) {
      throw new BadRequestException('End time cannot be before start time');
    }

    const eventData: Partial<Event> = {
      title: dto.title,
      description: dto.description,
      startTime: start,
      endTime: end,
      user,
    };

    if (category) {
      eventData.category = category;
    }

    const event = this.eventRepository.create(eventData);
    return this.eventRepository.save(event);
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['user', 'category'],
    });

    if (!event) throw new NotFoundException('Event not found');

    return event;
  }

  async findByDate(date: string): Promise<Event[]> {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  return this.eventRepository.find({
    where: {
      startTime: Between(startOfDay, endOfDay)
    },
    order: {
      startTime: 'ASC'
    }
  });
}


  async findAll(userId: number): Promise<Event[]> {
    const events = await this.eventRepository.find({
      where: { user: { id: userId } }, // <- filtramos por usuario
      relations: ['user', 'category'],
      order: { startTime: 'ASC' },
    });

    return events;
  }


  async update(id: number, dto: UpdateEventDto, userId: number): Promise<Event> {
    console.log('si llega al update del backend');
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['user', 'category'],
    });
    if (!event) throw new NotFoundException('Event not found');

    console.log('userId del token:', userId);
    console.log('userId del evento:', event.user?.id);


    if ('categoryId' in dto) {
      if (dto.categoryId === null) {
        event.category = undefined;
      } else if (dto.categoryId !== undefined) {
        if (typeof dto.categoryId !== 'number') {
          throw new BadRequestException('categoryId must be a number');
        }
        const category = await this.categoryRepository.findOneBy({ id: dto.categoryId });
        if (!category) throw new NotFoundException('Category not found');
        event.category = category;
      }
    }

    if (dto.title !== undefined) event.title = dto.title;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.startTime !== undefined) event.startTime = new Date(dto.startTime);
    if (dto.endTime !== undefined) event.endTime = dto.endTime ? new Date(dto.endTime) : undefined;

    return this.eventRepository.save(event);
  }

  async remove(id: number): Promise<void> {
    const event = await this.eventRepository.findOneBy({ id });
    if (!event) throw new NotFoundException('No se encontró el Evento');

    await this.eventRepository.remove(event);
  }
}
