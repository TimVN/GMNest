import { Injectable } from '@nestjs/common';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { InventoryItem } from '../_common/database/entities/inventory.entity';
import { Repository } from 'typeorm';
import { TradeItem } from './interfaces/trade-item.interface';

@Injectable()
export class TradingService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectRepository(InventoryItem)
    private inventoryItemRepository: Repository<InventoryItem>,
  ) {}

  /**
   * Get id of the user this user is in trade with
   * @param userId
   */
  getUserInTrade(userId: string) {
    return this.redis.get(`trading_${userId}`);
  }

  /**
   * Set the id of the user this user is in trade with
   * @param userId
   * @param otherUserId
   */
  setUserInTrade(userId: string, otherUserId: string) {
    return this.redis.set(`trading_${userId}`, otherUserId);
  }

  /**
   * Get the id of the user this user is awaiting trade-request acceptance from
   * @param userId
   */
  getUserAwaitingAcceptance(userId: string) {
    return this.redis.get(`trading_pending_${userId}`);
  }

  /**
   * Set the id of the user this user is awaiting trade-request acceptance from
   * @param userId
   * @param otherUserId
   */
  setUserAwaitingAcceptance(userId: string, otherUserId: string) {
    return this.redis.setex(`trading_pending_${userId}`, 10, otherUserId);
  }

  /**
   * Get the id of the user this user confirmed the trade with
   * @param userId
   */
  getUserConfirmedTrade(userId: string) {
    return this.redis.get(`trading_confirmed_${userId}`);
  }

  /**
   * Set the id of the user this user confirmed the trade with
   * @param userId
   * @param otherUserId
   */
  setUserConfirmedTrade(userId: string, otherUserId: string) {
    return this.redis.set(`trading_confirmed_${userId}`, otherUserId);
  }

  /**
   * Gets all items this user offered in the current trade
   * @param userId
   */
  async getItemsInTrade(userId: string) {
    const items = await this.redis.lrange(`trading_items_${userId}`, 0, -1);

    return items.map((item) => JSON.parse(item) as TradeItem);
  }

  /**
   * Returns whether an item is already in trade or not
   * @param userId
   * @param inventoryItemId
   */
  async isItemInTrade(userId: string, inventoryItemId: number) {
    const items = await this.redis.lrange(`trading_items_${userId}`, 0, -1);

    return !!items
      .map((item) => JSON.parse(item))
      .find((item) => item.id === inventoryItemId.toString());
  }

  /**
   * Adds an item to the active trade
   * @param userId
   * @param userInTrade
   * @param inventoryItemId
   * @param amount
   */
  async addItem(
    userId: string,
    userInTrade: string,
    inventoryItemId: number,
    amount: number,
  ) {
    const itemInTrade = await this.isItemInTrade(userId, inventoryItemId);

    // If it's already in the trade, stop
    if (itemInTrade) {
      return;
    }

    const otherTradeLocked = await this.isTradeLocked(userInTrade);

    // If the other party locked the trade, stop
    if (otherTradeLocked) {
      return;
    }

    const myTradeLocked = await this.isTradeLocked(userId);

    // If we locked the trade, stop
    if (myTradeLocked) {
      return;
    }

    const inventoryItem = await this.inventoryItemRepository.findOne(
      {
        id: inventoryItemId,
      },
      { relations: ['item'] },
    );

    // If the item doesn't exist for whatever reason, stop
    if (!inventoryItem || inventoryItem.amount < amount) {
      return;
    }

    amount = amount || 1;

    // Add it to the trade
    await this.redis.lpush(
      `trading_items_${userId}`,
      JSON.stringify({
        id: inventoryItemId,
        amount,
      }),
    );

    // Return the item with all its properties
    return inventoryItem;
  }

  /**
   * Sets a trade-lock for this user
   * @param userId
   */
  lockTrade(userId: string) {
    return this.redis.set(`trading_lock_${userId}`, 1);
  }

  /**
   * Returns whether a trade-lock is active for this user
   * @param userId
   */
  isTradeLocked(userId: string) {
    return this.redis.get(`trading_lock_${userId}`);
  }

  /**
   * Frees up the trade info stored in Redis for this user
   * @param userId
   */
  async clearTrade(userId: string) {
    await this.redis.del(`trading_items_${userId}`);
    await this.redis.del(`trading_${userId}`);
    await this.redis.del(`trading_pending_${userId}`);
    await this.redis.del(`trading_lock_${userId}`);
    await this.redis.del(`trading_confirmed_${userId}`);
  }
}
