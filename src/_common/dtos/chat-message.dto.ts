import { MaxLength, MinLength } from 'class-validator';

export class ChatMessageDto {
  identifier: 'world' | 'party';

  @MinLength(2)
  @MaxLength(140)
  content: string;

  sentAt?: number;
}
