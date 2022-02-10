import { IsDefined } from 'class-validator';

export class LockTradeDto {
  @IsDefined()
  userId: string;
}
