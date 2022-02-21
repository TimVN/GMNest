import { Injectable } from '@nestjs/common';
import { ChatMessageDto } from '../_common/dtos/chat-message.dto';
import { Client } from '../_common/interfaces/client.interface';
import { ChatPersistenceService } from './chat.persistence.service';

@Injectable()
export class ChatService {
  constructor(private chatPersistenceService: ChatPersistenceService) {}

  /**
   * Formats the content of a message, adds a date, stores it in Redis, and returns it
   * @param client
   * @param chatMessage
   */
  async sendMessage(client: Client, chatMessage: ChatMessageDto) {
    chatMessage.content = `${client.user.username}: ${chatMessage.content}`;
    chatMessage.sentAt = Date.now();

    await this.chatPersistenceService.addChatMessage(chatMessage);

    return chatMessage;
  }
}
