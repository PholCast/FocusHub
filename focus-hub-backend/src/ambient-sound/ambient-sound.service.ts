import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmbientSound } from './ambient-sound.entity';

@Injectable()
export class AmbientSoundService {
  constructor(
    @InjectRepository(AmbientSound)
    private readonly ambientSoundRepository: Repository<AmbientSound>,
  ) {}

  async findAll(): Promise<AmbientSound[]> {
    return this.ambientSoundRepository.find();
  }

  async findOne(id: number): Promise<AmbientSound> {
    const sound = await this.ambientSoundRepository.findOne({ where: { id } });
    if (!sound) {
      throw new NotFoundException(`AmbientSound with id ${id} not found`);
    }
    return sound;
  }

  async create(data: Partial<AmbientSound>): Promise<AmbientSound> {
    const newSound = this.ambientSoundRepository.create(data);
    return this.ambientSoundRepository.save(newSound);
  }

  async update(id: number, data: Partial<AmbientSound>): Promise<AmbientSound> {
    const sound = await this.findOne(id);
    Object.assign(sound, data);
    return this.ambientSoundRepository.save(sound);
  }

  async remove(id: number): Promise<void> {
    const result = await this.ambientSoundRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`AmbientSound with id ${id} not found`);
    }
  }
}
