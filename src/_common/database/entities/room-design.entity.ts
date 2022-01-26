import { AfterLoad, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RoomDesign {
  tileCount: number;

  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ nullable: false, default: [] })
  floorPlan: number[][];

  @Column('integer', { nullable: false, default: 1 })
  scale: number;

  @AfterLoad()
  afterLoad() {
    this.tileCount = this.floorPlan.reduce((a, b) => a + b.length, 0);
  }
}
