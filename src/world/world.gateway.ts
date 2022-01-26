import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Client } from '../_common/interfaces/client.interface';
import { Rooms } from '../_common/interfaces/rooms.interface';
import { ChatMessageDto } from '../_common/dtos/chat-message.dto';
import { AuthWsGuard } from '../_common/guards/auth-ws.guard';
import { UseGuards } from '@nestjs/common';
import { Subscribe } from '../_common/decorators/subscribe.decorator';
import { PlayerMoveDto } from '../_common/dtos/player-move.dto';
import { Rat } from '../_common/monsters/rat.monster';
import {WorldEvents} from './events.enum';

const rooms: Rooms = {
  rGrass: {
    npcs: [
      /*{
        entityId: randomUUID(),
        data: {
          x: 400,
          y: 100,
          name: 'Armor shop',
        },
        onInteract(client: Client) {
          console.log(`${client.data.name} clicked on our armor shop`);
          return {
            type: 'showDialog',
            payload: ['Hi there!', 'How you doin', 'Use WASD to move around!'],
          };
        },
      },

      {
        entityId: randomUUID(),
        data: {
          x: 500,
          y: 150,
          name: 'Angry Man',
        },
        onInteract(client: Client) {
          console.log(`${client.data.name} clicked on our armor shop`);
          return {
            type: 'showDialog',
            payload: ["Don't talk to me!"],
          };
        },
      },*/
    ],
    monsters: [new Rat('rmOne', 250, 400)],
  },
};

@WebSocketGateway()
export class WorldGateway {
  static ns = 'world';

  @WebSocketServer()
  private server: Server;

  @Subscribe(WorldGateway.ns, WorldEvents.JoinRoom)
  async joinRoom(client: Client, payload: { roomId: string }) {
    const oldRoomId = client.data.roomId;

    if (oldRoomId === payload.roomId) {
      return;
    }

    const room = rooms[payload.roomId];

    if (!room) {
      return;
    }

    if (oldRoomId) {
      // Leave room, tell others
      client.leave(oldRoomId);
      this.server.to(oldRoomId).emit('world:despawn', {
        entityId: client.id,
      });
    }

    client.data.roomId = payload.roomId;

    // Tell players already in the target room another player is joining
    this.server.to(payload.roomId).emit('world:spawn', {
      entityId: client.id,
      data: client.data,
    });

    const players = await this.playersInRoom(payload.roomId);

    // Send a snapshot of the room to the transitioning player
    const npcs = (room.npcs || []).map(({ entityId, data }) => ({
      entityId,
      data,
    }));
    client.emit('world:room:snapshot', {
      players,
      npcs,
    });

    // Spawn the transitioning player
    client.emit('world:spawn', {
      entityId: client.id,
      data: client.data,
    });

    client.join(payload.roomId);
  }

  @Subscribe(WorldGateway.ns, 'create-room')
  @UseGuards(AuthWsGuard)
  createPrivateRoom(client: Client) {
    // this.joinRoom(client, { roomId: client.id });
    return {
      roomId: client.id,
    };
  }

  // Testing private communication
  @Subscribe(WorldGateway.ns, 'player:clicked')
  playerClicked(client: Client, payload: { entityId: string }) {
    const chatMessage: ChatMessageDto = {
      content: `${client.data.name} clicked on you!`,
      sentAt: Date.now(),
    };

    // Send message to person clicked on
    this.server.to(payload.entityId).emit('chat:message', chatMessage);
  }

  // Testing private communication
  @Subscribe(WorldGateway.ns, 'npc:interact')
  npcInteract(client: Client, payload: { entityId: string }) {
    console.log(`${payload.entityId} was clicked`);
    const room = rooms[client.data.roomId];

    if (!room) {
      return;
    }

    const npc = room.npcs.find((n) => n.entityId === payload.entityId);

    if (!npc) {
      return;
    }

    const interaction = npc.onInteract(client);

    if (interaction) {
      console.log(interaction.type);
      console.log(interaction.payload);
    }

    if (!interaction) {
      return;
    }

    return interaction;
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

  handleDisconnect(client: Client) {
    this.server
      .to(client.data.roomId)
      .emit('world:despawn', { entityId: client.id });
  }
}
