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

  async handleConnection(client: Client) {
    const messages = await this.chatPersistenceService.getHistory();
    client.emit('chat:history', messages);
  }

  @Subscribe(ChatGateway.ns, 'message')
  async handleMessage(client: Client, chatMessage: ChatMessageDto) {
    if (chatMessage.content.charAt(0) === '/') {
      const [event, payload] = await this.commandsService.parseCommand(
        client,
        chatMessage.content,
      );

      console.log(event, payload);

      if (!event) {
        return;
      }

      this.server.to(client.data.roomId).emit(event.toString(), payload);
      return;
    }

    this.server.emit(
      'chat:message',
      this.chatService.sendMessage(client, chatMessage),
    );
  }
}
