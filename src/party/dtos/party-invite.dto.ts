import { IsDefined } from 'class-validator';

export class PartyInviteDto {
  @IsDefined()
  userId: string;
}
