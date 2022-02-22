import { applyDecorators } from '@nestjs/common';
import { SubscribeMessage } from '@nestjs/websockets';

export function Subscribe(namespace: string, event: string) {
  return applyDecorators(SubscribeMessage(`${namespace}:${event}`));
}
