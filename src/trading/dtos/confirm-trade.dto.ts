import { IsDefined } from 'class-validator';
import { TradeItem } from '../interfaces/trade-item.interface';

export class ConfirmTradeDto {
  @IsDefined()
  userId: string;

  items: TradeItem[];
}
