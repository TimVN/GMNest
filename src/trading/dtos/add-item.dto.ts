import { IsDefined } from 'class-validator';

export class AddItemDto {
  @IsDefined()
  id: number;
}
