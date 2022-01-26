import { Test, TestingModule } from '@nestjs/testing';
import { WorldGateway } from './world.gateway';

describe('WorldGateway', () => {
  let gateway: WorldGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorldGateway],
    }).compile();

    gateway = module.get<WorldGateway>(WorldGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
