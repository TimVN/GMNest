import { Injectable } from '@nestjs/common';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { InventoryItem } from '../_common/database/entities/inventory.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TradingService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectRepository(InventoryItem)
    private inventoryItemRepository: Repository<InventoryItem>,
  ) {}

  async test(id1, id2) {
    await this.redis.del(`trading_${id1}`);
    await this.redis.del(`trading_pending_${id1}`);
    await this.redis.del(`trading_${id2}`);
    await this.redis.del(`trading_pending_${id2}`);
  }

  isUserInTrade(userId: string) {
    return this.redis.get(`trading_${userId}`);
  }

  setUserInTrade(userId: string, otherUserId: string) {
    return this.redis.set(`trading_${userId}`, otherUserId);
  }

  setUserAwaitingAcceptance(userId: string, otherUserId: string) {
    return this.redis.setex(`trading_pending_${userId}`, 10, otherUserId);
  }

  getUserAwaitingAcceptance(userId: string) {
    return this.redis.get(`trading_pending_${userId}`);
  }

  async isItemInTrade(userId: string, inventoryItemId: number) {
    const items = await this.redis.lrange(`trading_items_${userId}`, 0, -1);

    console.log('Items in trade');
    console.log(items);

    return !!items.find((id) => id === inventoryItemId.toString());
  }

  async addItem(userId: string, inventoryItemId: number) {
    const itemInTrade = await this.isItemInTrade(userId, inventoryItemId);

    if (itemInTrade) {
      return;
    }

    const inventoryItem = await this.inventoryItemRepository.findOne(
      {
        id: inventoryItemId,
      },
      { relations: ['item'] },
    );

    if (!inventoryItem) {
      return;
    }

    await this.redis.lpush(`trading_items_${userId}`, inventoryItemId);

    return inventoryItem;
  }

  async clearTrade(userId: string) {
    await this.redis.lrem(`trading_items_${userId}`, 0, -1);
    await this.redis.del(`trading_${userId}`);
    await this.redis.del(`trading_pending_${userId}`);
  }
}
