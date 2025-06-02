import { Test, TestingModule } from '@nestjs/testing';
import { AmbientSoundController } from './ambient-sound.controller';

describe('MediaController', () => {
  let controller: AmbientSoundController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AmbientSoundController],
    }).compile();

    controller = module.get<AmbientSoundController>(AmbientSoundController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
