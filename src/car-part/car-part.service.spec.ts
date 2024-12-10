import { Test, TestingModule } from '@nestjs/testing';
import { CarPartService } from './car-part.service';

describe('CarPartService', () => {
  let service: CarPartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarPartService],
    }).compile();

    service = module.get<CarPartService>(CarPartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
