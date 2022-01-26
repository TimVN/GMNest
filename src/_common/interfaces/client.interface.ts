import { Socket } from 'socket.io';
import { Movement } from '../dtos/player-move.dto';

export interface Client extends Partial<Socket> {
  user?: any;
  event?: string;

  data?: {
    name: string;
    roomId: string;
    x: number;
    y: number;
    movement: Movement;
    event: string;
  };
}
