import { Injectable } from '@nestjs/common';
import { Client } from '../_common/interfaces/client.interface';
import { PlayerTeleportDto } from '../_common/dtos/player-teleport.dto';
import { ChatPersistenceService } from './chat.persistence.service';

@Injectable()
export class CommandsService {
  constructor(private chatPersistenceService: ChatPersistenceService) {}

  parseCommand(client: Client, message: string) {
    const command = message.split(' ');

    switch (command[0]) {
      case '/tp':
        if (command.length < 2) {
          return;
        }
        return this.teleport(client, +command[1], +command[2]);

      case '/clear':
        this.chatPersistenceService.clearChatHistory();
        break;
    }

    return [];
  }

  teleport(client: Client, xpos: number, ypos: number) {
    const teleportDto: PlayerTeleportDto = {
      entityId: client.id,
      xpos,
      ypos,
    };
    return ['players:teleport', teleportDto];
  }
}
