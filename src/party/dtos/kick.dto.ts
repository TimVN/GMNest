import { IsDefined } from 'class-validator';

export class KickDto {
  @IsDefined()
  userId: string;
}
