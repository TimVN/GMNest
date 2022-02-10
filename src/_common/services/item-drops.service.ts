import { Injectable } from '@nestjs/common';
import { Item } from '../database/entities/item.entity';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { randomUUID } from 'crypto';

@Injectable()
export class ItemDropsService {
  constructor(@InjectRedis() private readonly redis: Redis) {
    // this.redis.del('drops_rGrass').then(() => null);
  }

  async addDrop(roomId: string, position, amount: number, item: Item) {
    const drop = {
      id: item.id,
      amount,
      dropId: randomUUID(),
      label: item.label,
      iconSetIndex: item.iconSetIndex,
      iconIndex: item.iconIndex,
      xPos: position.xPos,
      yPos: position.yPos,
    };

    await this.redis.lpush(`drops_${roomId}`, JSON.stringify(drop));

    return drop;
  }

  async removeDrop(roomId: string, index: number) {
    await this.redis.lset(`drops_${roomId}`, index, 'DELETED');
    return await this.redis.lrem(`drops_${roomId}`, 1, 'DELETED');
  }

  async getDrops(roomId: string) {
    const drops = await this.redis.lrange(`drops_${roomId}`, 0, -1);

    return drops.map((drop) => JSON.parse(drop));
  }
}
