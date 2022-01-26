export type WsEvent<T> = T & {
  event: string;
};
