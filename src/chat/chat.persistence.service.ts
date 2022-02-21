import { Injectable } from '@nestjs/common';
import { ChatMessageDto } from '../_common/dtos/chat-message.dto';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';

@Injectable()
export class ChatPersistenceService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * Adds a chat message to the global chat cache
   * @param message
   */
  async addChatMessage(message: ChatMessageDto) {
    await this.redis
      .multi()
      .lpush(`chat:history`, JSON.stringify(message))
      .ltrim(`chat:history`, 0, 10)
      .exec();
  }

  /**
   * Gets the global chat history
   */
  async getHistory(): Promise<ChatMessageDto[]> {
    const response = await this.redis.lrange('chat:history', 0, -1);

    return response.map((message) => JSON.parse(message));
  }

  /**
   * Clears the global chat history
   */
  async clearChatHistory() {
    await this.redis.del('chat:history');
  }

  /**
   * Get a player's current party ID
   * @param userId
   */
  getPlayerPartyId(userId: string) {
    return this.redis.get(`party_id_${userId}`);
  }
}
