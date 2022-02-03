import { IsDefined } from 'class-validator';

export class AcceptProposalDto {
  @IsDefined()
  userId: string;
}
