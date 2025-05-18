import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common'
import { EventsService } from './events.service'
import { CreateEventDto } from './dto/create-event.dto'
import { UpdateEventDto } from './dto/update-event.dto'
import { Event } from './event.entity'

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() dto: CreateEventDto): Promise<Event> {
    return this.eventsService.create(dto)
  }

  @Get()
  findAll(): Promise<Event[]> {
    return this.eventsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Event> {
    return this.eventsService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateEventDto): Promise<Event> {
    return this.eventsService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.eventsService.remove(id)
  }
}
