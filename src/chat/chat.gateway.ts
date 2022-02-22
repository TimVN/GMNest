import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatMessageDto } from '../_common/dtos/chat-message.dto';
import { ChatService } from './chat.service';
import { Client } from '../_common/interfaces/client.interface';
import { Subscribe } from '../_common/decorators/subscribe.decorator';
import { ChatPersistenceService } from './chat.persistence.service';
import { ChatEvents } from './enums/chat-events.enum';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  static ns = 'chat';

  constructor(
    private chatService: ChatService,
    private chatPersistenceService: ChatPersistenceService,
  ) {}

  @WebSocketServer()
  private server: Server;

  @Subscribe(ChatGateway.ns, ChatEvents.History)
  async getChatHistory() {
    return this.chatPersistenceService.getHistory();
  }

  @Subscribe(ChatGateway.ns, ChatEvents.Message)
  async handleMessage(client: Client, chatMessage: ChatMessageDto) {
    const message = await this.chatService.sendMessage(client, chatMessage);

    this.server.emit('chat:message', message);
  }
}
