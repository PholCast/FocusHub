import { Test, TestingModule } from '@nestjs/testing';
import { AmbientSoundService } from './ambient-sound.service';

describe('AmbientSoundService', () => {
  let service: AmbientSoundService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmbientSoundService],
    }).compile();

    service = module.get<AmbientSoundService>(AmbientSoundService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
