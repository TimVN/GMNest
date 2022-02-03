import { Injectable } from '@nestjs/common';
import { ChatMessageDto } from '../_common/dtos/chat-message.dto';
import { Client } from '../_common/interfaces/client.interface';
import { ChatPersistenceService } from './chat.persistence.service';
import { MonsterPersistenceService } from '../_common/modules/monster.module';

@Injectable()
export class ChatService {
  constructor(
    private chatPersistenceService: ChatPersistenceService,
    private monsterPersistenceService: MonsterPersistenceService,
  ) {}

  sendMessage(client: Client, chatMessage: ChatMessageDto) {
    chatMessage.content = `${client.data.username}: ${chatMessage.content}`;
    chatMessage.sentAt = Date.now();

    this.chatPersistenceService.addChatMessage(chatMessage);

    return chatMessage;
  }
}
