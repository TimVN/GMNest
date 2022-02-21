import { IsDefined } from 'class-validator';

export enum PartyResponseCode {
  Success,
  Error,
  NotAccepting,
  Busy,
  Full,
}

export class PartyResponse {
  constructor(code: PartyResponseCode) {
    this.code = code;
  }

  @IsDefined()
  code: PartyResponseCode;
}
