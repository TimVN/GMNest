import { Client } from './client.interface';

export interface Rooms {
  [key: string]: {
    npcs: {
      entityId: string;
      data: {
        name: string;
        x: number;
        y: number;
      };
      onInteract: (client: Client) => void | { type: string; payload: any };
    }[];
    monsters: Monster[];
  };
}

export interface Monster {
  mid: string;
  x: number;
  y: number;
}
