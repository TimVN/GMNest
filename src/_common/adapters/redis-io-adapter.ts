import { IoAdapter } from '@nestjs/platform-socket.io';
import { RedisClient } from 'redis';
import { ServerOptions, Socket } from 'socket.io';
import { createAdapter } from 'socket.io-redis';
import * as msgPackParser from 'socket.io-msgpack-parser';
import { Client } from '../interfaces/client.interface';
import { AuthService } from '../../auth/auth.service';
import { INestApplicationContext } from '@nestjs/common';
import {
  first,
  fromEvent,
  map,
  mergeMap,
  Observable,
  share,
  takeUntil,
} from 'rxjs';
import { DISCONNECT_EVENT } from '@nestjs/websockets/constants';
import { MessageMappingProperties } from '@nestjs/websockets';
import { isFunction } from '@nestjs/common/utils/shared.utils';

const pubClient = new RedisClient({ host: 'localhost', port: 6379 });
const subClient = pubClient.duplicate();
const redisAdapter = createAdapter({ pubClient, subClient });

export class RedisIoAdapter extends IoAdapter {
  private authService: AuthService;

  constructor(app: INestApplicationContext) {
    super(app);

    app.resolve<AuthService>(AuthService).then((authService) => {
      this.authService = authService;
    });
  }

  bindClientConnect(server, callback: () => void) {
    server.on('connection', callback);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    options.parser = msgPackParser;
    // options.transports = ['websocket'];

    const server = super.createIOServer(port, options);
    server.adapter(redisAdapter);


    server.use(async (client: Client, next: () => void) => {
      const user = await this.authService.getUser(
        client.handshake.headers.authorization,
      );

      if (!user) {
        return client.conn.close();
      }

      client.user = user;
      client.data.username = user.username;

      client.emit('authorized');

      next();
    });

    return server;
  }

  public bindMessageHandlers(
    client: Client,
    handlers: MessageMappingProperties[],
    transform: (data: any) => Observable<any>,
  ) {
    const disconnect$ = fromEvent(client as Socket, DISCONNECT_EVENT).pipe(
      share(),
      first(),
    );

    handlers.forEach(({ message, callback }) => {
      const source$ = fromEvent(client as Socket, message).pipe(
        mergeMap((payload: any) => {
          const { data, ack } = this.mapPayload(payload);

          client.event = message;

          return transform(callback(data, ack)).pipe(
            map((response: any) => [response, ack]),
          );
        }),
        takeUntil(disconnect$),
      );

      source$.subscribe(([response, ack]) => {
        if (isFunction(ack)) {
          ack(null, response);
        }
      });
    });
  }
}
