import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatPersistenceService } from './chat.persistence.service';
import { CommandsService } from './commands.service';

@Module({
  providers: [
    ChatService,
    ChatPersistenceService,
    CommandsService,
    ChatGateway,
  ],
})
export class ChatModule {}
