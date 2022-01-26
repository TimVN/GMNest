import { applyDecorators } from '@nestjs/common';
import { SubscribeMessage } from '@nestjs/websockets';

export function Subscribe(...names: string[]) {
  return applyDecorators(SubscribeMessage(names.join(':')));
}
