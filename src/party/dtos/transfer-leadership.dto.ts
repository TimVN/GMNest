import { IsDefined } from 'class-validator';

export class TransferLeadershipDto {
  @IsDefined()
  userId: string;
}
