import { Injectable } from '@nestjs/common';
import { encode } from '@msgpack/msgpack';

@Injectable()
export class EncodingService {
  encode(payload: any) {
    return payload;
    const encoded: Uint8Array = encode(payload);
    return Buffer.from(encoded.buffer, encoded.byteOffset, encoded.byteLength);
  }
}
