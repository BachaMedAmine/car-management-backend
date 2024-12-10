import { Test, TestingModule } from '@nestjs/testing';
import { CarPartController } from './car-part.controller';

describe('CarPartController', () => {
  let controller: CarPartController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarPartController],
    }).compile();

    controller = module.get<CarPartController>(CarPartController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
