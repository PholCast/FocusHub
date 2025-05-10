import { Test, TestingModule } from '@nestjs/testing';
import { TechniquesController } from './techniques.controller';

describe('TechniquesController', () => {
  let controller: TechniquesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TechniquesController],
    }).compile();

    controller = module.get<TechniquesController>(TechniquesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
