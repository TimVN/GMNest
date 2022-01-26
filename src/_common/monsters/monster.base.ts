import { randomUUID } from 'crypto';

export class MonsterBase {
  mid = randomUUID();
  room: string;
  x: number;
  y: number;

  constructor(room: string, x: number, y: number) {
    this.room = room;
    this.x = x;
    this.y = y;
  }
}
