import { IsDefined } from 'class-validator';

export enum TradingResponseCode {
  Success,
  Error,
  NotAccepting,
  Busy,
}

export class TradingResponse {
  constructor(code: TradingResponseCode) {
    this.code = code;
  }

  @IsDefined()
  code: TradingResponseCode;
}
