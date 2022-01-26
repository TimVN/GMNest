import { MonsterBase } from './monster.base';

export class Rat extends MonsterBase {
  constructor(room: string, x: number, y: number) {
    super(room, x, y);
  }

  get id() {
    return this.mid;
  }
}
