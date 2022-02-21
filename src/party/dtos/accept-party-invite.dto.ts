import { IsDefined } from 'class-validator';

export class AcceptPartyInviteDto {
  @IsDefined()
  userId: string;
}
