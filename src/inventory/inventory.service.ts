import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Inventory,
  InventoryItem,
} from '../_common/database/entities/inventory.entity';
import { Repository } from 'typeorm';
import { Item } from '../_common/database/entities/item.entity';
import { ItemDropsService } from '../_common/services/item-drops.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory) private repository: Repository<Inventory>,
    @InjectRepository(Item) private itemRepository: Repository<Item>,
    @InjectRepository(InventoryItem)
    private inventoryItemRepository: Repository<InventoryItem>,
    private itemDropsService: ItemDropsService,
  ) {}

  getUserInventory(userId: string) {
    return this.repository.findOne(
      { userId },
      { relations: ['items', 'items.item'] },
    );
  }

  async useInventoryItem(id: number) {
    const item = await this.getInventoryItem(id);

    return item;
  }

  async dropInventoryItem(
    roomId: string,
    position: any,
    id: number,
    amount: number,
  ) {
    const item = await this.getInventoryItem(id);

    if (!item || item.amount < amount) {
      return;
    }

    if (item.amount > 1) {
      item.amount -= amount;

      await this.updateInventoryItem(item);
      const drop = await this.itemDropsService.addDrop(
        roomId,
        position,
        amount,
        item.item,
      );

      if (item.amount === 0) {
        await this.deleteInventoryItem(item.id);
        const drop = await this.itemDropsService.addDrop(
          roomId,
          position,
          amount,
          item.item,
        );

        return {
          amount: 0,
          drop,
        };
      }

      return {
        amount: item.amount,
        drop,
      };
    } else {
      await this.deleteInventoryItem(item.id);
      const drop = await this.itemDropsService.addDrop(
        roomId,
        position,
        1,
        item.item,
      );

      return {
        amount: 0,
        drop,
      };
    }
  }

  async pickupDrop(userId: string, roomId: string, id: string) {
    const drops = await this.itemDropsService.getDrops(roomId);
    const drop = drops.find((d) => d.dropId === id);
    const index = drops.findIndex((d) => d.dropId === id);

    if (!drop) {
      return;
    }

    const ok = await this.itemDropsService.removeDrop(roomId, index);

    if (!ok) {
      return;
    }

    const item = await this.itemRepository.findOne({ id: drop.id });
    const inventory = await this.repository.findOne(
      { userId },
      { relations: ['items', 'items.item'] },
    );

    if (!item || !inventory) {
      return;
    }

    if (item.stackable) {
      const items = [];

      while (drop.amount > 0) {
        const existingItem = inventory.items.find((entry) => {
          return entry.item.id === item.id;
        });

        if (existingItem) {
          const difference = item.stackSize - existingItem.amount;
          const add = Math.min(difference, drop.amount);
          existingItem.amount += add;

          drop.amount -= add;

          items.push(await this.inventoryItemRepository.save(existingItem));
        } else {
          const inventoryItem = new InventoryItem();

          inventoryItem.item = item;
          inventoryItem.inventory = inventory;
          inventoryItem.amount = drop.amount;

          drop.amount = 0;

          items.push(await this.inventoryItemRepository.save(inventoryItem));
        }
      }

      return items;
    } else {
      const inventoryItem = new InventoryItem();

      inventoryItem.item = item;
      inventoryItem.inventory = inventory;
      inventoryItem.amount = drop.amount;

      return [await this.inventoryItemRepository.save(inventoryItem)];
    }
  }

  getInventoryItem(id: number) {
    return this.inventoryItemRepository.findOne(
      { id },
      { relations: ['item'] },
    );
  }

  updateInventoryItem(item: InventoryItem) {
    return this.inventoryItemRepository.save(item);
  }

  deleteInventoryItem(id: number) {
    return this.inventoryItemRepository.delete(id);
  }

  async addItemToInventory(userId: string, itemId: number, amount: number) {
    const inventory = await this.repository.findOne({ userId });

    if (!inventory) {
      return;
    }

    const item = await this.itemRepository.findOne(itemId);

    if (!item) {
      return;
    }

    const inventoryItem = new InventoryItem();

    inventoryItem.inventory = inventory;
    inventoryItem.item = item;
    inventoryItem.amount = Math.min(amount || 1, item.stackSize);

    await this.inventoryItemRepository.save(inventoryItem);

    return ['inventory:add', inventoryItem];
  }

  getInventory(userId: string) {
    return this.repository.findOne({ userId });
  }

  getInventoryItems(itemIds: number[]) {
    return this.inventoryItemRepository
      .createQueryBuilder('inventory_item')
      .leftJoinAndSelect('inventory_item.item', 'item')
      .where('inventory_item.id IN(:...itemIds)', { itemIds })
      .getMany();
  }
}