import { Test, TestingModule } from '@nestjs/testing';
import { MetaOptionsService } from './meta-options.service.js';

describe('MetaOptionsService', () => {
  let service: MetaOptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetaOptionsService],
    }).compile();

    service = module.get<MetaOptionsService>(MetaOptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
