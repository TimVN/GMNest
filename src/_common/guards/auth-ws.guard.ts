import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Client } from '../interfaces/client.interface';

@Injectable()
export class AuthWsGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const client = context.switchToWs().getClient<Client>();
    return !!client.user;
  }
}
