import { WebSocketGateway } from '@nestjs/websockets';
import { Client } from '../_common/interfaces/client.interface';
import { AuthService } from './auth.service';

@WebSocketGateway()
export class AuthGateway {
  static ns = 'auth';

  constructor(private authService: AuthService) {}

  async handleConnection(client: Client) {
    const user = await this.authService.getUser(
      client.handshake.headers.authorization,
    );

    if (!user) {
      return client.conn.close();
    }

    client.user = user;
    client.data.name = user.username;

    client.emit('authorized');
  }
}
