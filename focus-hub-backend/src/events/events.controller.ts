import { Controller, Get, Post, Param, Body, Put, Delete, UseGuards, Request } from '@nestjs/common'
import { EventsService } from './events.service'
import { CreateEventDto } from './dto/create-event.dto'
import { UpdateEventDto } from './dto/update-event.dto'
import { Event } from './event.entity'
import { AuthGuard } from '@nestjs/passport';


@UseGuards(AuthGuard('jwt'))
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() dto: CreateEventDto, @Request() req): Promise<Event> {
    const userId = req.user.sub; // O req.user.id según cómo tengas el payload del JWT
    return this.eventsService.create(dto, userId);
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
  update(@Param('id') id: number, @Body() dto: UpdateEventDto, @Request() req): Promise<Event> {
    const userId = req.user.sub;
    return this.eventsService.update(id, dto, userId)
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.eventsService.remove(id)
  }
}
