import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { AmbientSoundService } from './ambient-sound.service';
import { AmbientSound } from './ambient-sound.entity';

@Controller('ambient-sounds')
export class AmbientSoundController {
  constructor(private readonly ambientSoundService: AmbientSoundService) {}

  @Get()
  getAll(): Promise<AmbientSound[]> {
    return this.ambientSoundService.findAll();
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number): Promise<AmbientSound> {
    return this.ambientSoundService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<AmbientSound>): Promise<AmbientSound> {
    return this.ambientSoundService.create(data);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<AmbientSound>,
  ): Promise<AmbientSound> {
    return this.ambientSoundService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.ambientSoundService.remove(id);
  }
}
