import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Item } from './item.entity';

@Entity()
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  @Index()
  userId: string;

  @OneToMany(() => InventoryItem, (inventoryItem) => inventoryItem.inventory)
  items: InventoryItem[];
}

@Entity()
export class InventoryItem {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Item)
  item: Item;

  @Column({ default: 1 })
  amount: number;

  @Column({ default: 0 })
  slot: number;

  @ManyToOne(() => Inventory, (inventory) => inventory.items)
  inventory: Inventory;
}
