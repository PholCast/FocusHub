import { Controller, Get, Post, Param, Body, Put, Delete, UseGuards, Request, Query } from '@nestjs/common'
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
    const userId = req.user.userId;
    console.log("USERID:", req.user.userId)
    return this.eventsService.create(dto, userId);
  }

  @Get()
  findAll(@Request() req): Promise<Event[]> {
    const userId = req.user.userId;
    return this.eventsService.findAll(userId);
  }


  @Get(':id')
  findOne(@Param('id') id: number): Promise<Event> {
    return this.eventsService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateEventDto, @Request() req): Promise<Event> {
    const userId = req.user.userId;
    return this.eventsService.update(id, dto, userId)
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.eventsService.remove(id)
  }

  @Get('by-date')
  getEventsByDate(@Query('date') date: string): Promise<Event[]> {
    return this.eventsService.findByDate(date);
  }
}
