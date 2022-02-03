import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Inventory } from './inventory.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  username: string;

  @Column({ nullable: false })
  password: string;
}
