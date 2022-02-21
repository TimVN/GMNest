import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatMessageDto } from '../_common/dtos/chat-message.dto';
import { ChatService } from './chat.service';
import { Client } from '../_common/interfaces/client.interface';
import { Subscribe } from '../_common/decorators/subscribe.decorator';
import { ChatPersistenceService } from './chat.persistence.service';
import { CommandsService } from './commands.service';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  static ns = 'chat';

  constructor(
    private chatService: ChatService,
    private chatPersistenceService: ChatPersistenceService,
    private commandsService: CommandsService,
  ) {}

  @WebSocketServer()
  private server: Server;

  @Subscribe(ChatGateway.ns, 'history')
  async getChatHistory() {
    const messages = await this.chatPersistenceService.getHistory();
    return { identifier: 'world', messages: messages || [] };
  }

  @Subscribe(ChatGateway.ns, 'message')
  async handleMessage(client: Client, chatMessage: ChatMessageDto) {
    if (chatMessage.content.charAt(0) === '/') {
      const [event, payload] = await this.commandsService.parseCommand(
        client,
        chatMessage.content,
      );

      if (!event) {
        return;
      }

      this.server.to(client.data.roomId).emit(event.toString(), payload);
      return;
    }

    if (chatMessage.identifier === 'world') {
      this.server.emit(
        'chat:message',
        this.chatService.sendMessage(client, chatMessage),
      );
    } else {
      const identifier = await this.getRoomIdentifier(
        client,
        chatMessage.identifier,
      );

      if (identifier) {
        this.server.to(identifier).emit('chat:message', chatMessage);
      }
    }
  }

  async getRoomIdentifier(client: Client, identifier: 'party' | 'guild') {
    switch (identifier) {
      case 'party':
        return this.chatPersistenceService.getPlayerPartyId(client.id);

      default:
        return '';
    }
  }
}
