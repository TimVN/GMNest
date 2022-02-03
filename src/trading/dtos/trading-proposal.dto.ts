import { IsDefined } from 'class-validator';

export class TradingProposalDto {
  @IsDefined()
  userId: string;
}
