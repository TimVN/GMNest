import { Socket } from 'socket.io';
import { Movement } from '../dtos/player-move.dto';
import { User } from '../database/entities/user.entity';

export interface Client extends Partial<Socket> {
  user?: User;
  event?: string;

  data?: {
    username: string;
    roomId: string;
    x: number;
    y: number;
    movement: Movement;
    event: string;
  };
}
