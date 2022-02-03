import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Client } from './_common/interfaces/client.interface';

@WebSocketGateway()
export class AppGateway {
  @WebSocketServer()
  private server: Server;

  handleConnection(client: Client) {
    client.setMaxListeners(15);
  }
}
