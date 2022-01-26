import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Client } from '../_common/interfaces/client.interface';
import { ChatMessageDto } from '../_common/dtos/chat-message.dto';
import { Subscribe } from '../_common/decorators/subscribe.decorator';
import { PlayerMoveDto } from '../_common/dtos/player-move.dto';
import { PlayerEvents } from './player-events.enum';

@WebSocketGateway()
export class PlayersGateway {
  static ns = 'players';

  @WebSocketServer()
  private server: Server;

  handleConnection(client: Client) {
    client.data.x = 600;
    client.data.y = 100;
  }

  @Subscribe(PlayersGateway.ns, PlayerEvents.Move)
  playerMove(client: Client, move: PlayerMoveDto) {
    move.entityId = client.id;
    client.data.x = move.xpos;
    client.data.y = move.ypos;
    client.data.movement = move.movement;

    // Simply pass on receiving data to all others in that room
    // Client has a string called 'event' which contains the current event
    this.server.to(client.data.roomId).emit(client.event, move);
  }

  // Testing private communication
  @Subscribe(PlayersGateway.ns, 'player:clicked')
  playerClicked(client: Client, payload: { entityId: string }) {
    const chatMessage: ChatMessageDto = {
      content: `${client.data.name} clicked on you!`,
      sentAt: Date.now(),
    };

    // Send message to person clicked on
    this.server.to(payload.entityId).emit('chat:message', chatMessage);
  }

  // Gets all players (sockets) in room with a certain id
  async playersInRoom(id: string) {
    const room = await this.server.of('/').adapter.rooms.get(id);
    const socketIds = Array.from(room || []);
    const players = [];

    for (let i = 0; i < socketIds.length; i++) {
      const { data } = await this.server.of('/').sockets.get(socketIds[i]);

      players.push({
        entityId: socketIds[i],
        data,
      });
    }

    return players;
  }
}
