import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ItemCategory } from './item-category.entity';

@Entity()
export class Item {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  label: string;

  @Column({ default: false })
  stackable: boolean;

  @Column({ default: 1 })
  stackSize: number;

  @Column({ default: 0 })
  iconSetIndex: number;

  @Column({ default: 0 })
  iconIndex: number;

  @ManyToOne(() => ItemCategory)
  category: ItemCategory;
}
