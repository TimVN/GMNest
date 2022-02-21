import { applyDecorators } from '@nestjs/common';
import { SubscribeMessage } from '@nestjs/websockets';

export function Subscribe(namespace: string, event: string) {
  return applyDecorators(SubscribeMessage(`${namespace}:${event}`));
}

export function TestDecorator() {
  return function (
    target,
    decoratedFnName: string,
    descriptor: PropertyDescriptor,
  ) {
    console.log(target);
    console.log(decoratedFnName);
    console.log(descriptor);
    console.log(descriptor.value.name);
  };
}
