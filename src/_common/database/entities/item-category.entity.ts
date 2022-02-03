import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ItemCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  label: string;
}
