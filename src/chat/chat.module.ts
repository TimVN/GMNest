import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatPersistenceService } from './chat.persistence.service';

@Module({
  providers: [ChatService, ChatPersistenceService, ChatGateway],
})
export class ChatModule {}
