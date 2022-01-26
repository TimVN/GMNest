import { MaxLength, MinLength } from 'class-validator';

export class ChatMessageDto {
  @MinLength(2)
  @MaxLength(140)
  content: string;

  sentAt?: number;
}
