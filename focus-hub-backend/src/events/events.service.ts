import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Event } from './event.entity'
import { CreateEventDto } from './dto/create-event.dto'
import { UpdateEventDto } from './dto/update-event.dto'
import { User } from '../users/user.entity'
import { Category } from '../categories/category.entity'

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

  async create(dto: CreateEventDto): Promise<Event> {
    const user = await this.userRepository.findOneBy({ id: dto.user_id })
    if (!user) throw new NotFoundException('User not found')

    let category: Category | null = null
    if (dto.category_id) {
      category = await this.categoryRepository.findOneBy({ id: dto.category_id })
      if (!category) throw new NotFoundException('Category not found')
    }

    const event = this.eventRepository.create({
      title: dto.title,
      description: dto.description,
      startTime: new Date(dto.startTime),
      endTime: dto.endTime ? new Date(dto.endTime) : null,
      user,
      ...(category ? { category } : {}),
    })

    return this.eventRepository.save(event)
  }

  async findAll(): Promise<Event[]> {
    return this.eventRepository.find({
      relations: ['user', 'category'],
      order: { startTime: 'ASC' },
    })
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['user', 'category'],
    })

    if (!event) throw new NotFoundException('Event not found')
    return event
  }

  async update(id: number, dto: UpdateEventDto): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['user', 'category'],
    })
    if (!event) throw new NotFoundException('Event not found')

    if (dto.user_id !== undefined) {
      const user = await this.userRepository.findOneBy({ id: dto.user_id })
      if (!user) throw new NotFoundException('User not found')
      event.user = user
    }

    if (dto.category_id !== undefined) {
      if (dto.category_id === null) {
        event.category = null
      } else {
        const category = await this.categoryRepository.findOneBy({ id: dto.category_id })
        if (!category) throw new NotFoundException('Category not found')
        event.category = category
      }
    }

    if (dto.title !== undefined) event.title = dto.title
    if (dto.description !== undefined) event.description = dto.description
    if (dto.startTime !== undefined) event.startTime = new Date(dto.startTime)
    if (dto.endTime !== undefined) {
      event.endTime = dto.endTime ? new Date(dto.endTime) : null
    }

    return this.eventRepository.save(event)
  }

  async remove(id: number): Promise<void> {
    const result = await this.eventRepository.delete(id)
    if (result.affected === 0) {
      throw new NotFoundException('Event not found')
    }
  }
}
