import { Socket } from 'socket.io';
import { User } from './user.interface';

export interface Client extends Partial<Socket> {
  user?: User;
  event?: string;
}
