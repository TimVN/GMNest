import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Subscribe } from '../_common/decorators/subscribe.decorator';
import { Client } from '../_common/interfaces/client.interface';
import { InventoryService } from './inventory.service';

@WebSocketGateway()
export class InventoryGateway {
  static ns = 'inventory';

  constructor(private inventoryService: InventoryService) {}

  @WebSocketServer()
  private server: Server;

  @Subscribe(InventoryGateway.ns, 'load')
  loadInventory(client: Client) {
    return this.inventoryService.getUserInventory(client.user.id);
  }

  @Subscribe(InventoryGateway.ns, 'use')
  async useInventoryItem(client: Client, payload) {
    const item = await this.inventoryService.useInventoryItem(payload.id);

    this.server.to(client.data.roomId).emit('chat:message', {
      content: `${client.data.username} used ${item.item.label}`,
    });
  }

  @Subscribe(InventoryGateway.ns, 'drop')
  async dropInventoryItem(client: Client, payload) {
    const { amount, drop } = await this.inventoryService.dropInventoryItem(
      client.data.roomId,
      payload.position,
      payload.id,
      payload.amount,
    );

    if (drop) {
      this.server.to(client.data.roomId).emit('world:drop', drop);

      client.emit('inventory:update', { id: payload.id, amount });
    }
  }

  @Subscribe(InventoryGateway.ns, 'drop:pickup')
  async pickupDrop(client: Client, payload) {
    const inventoryItems = await this.inventoryService.pickupDrop(
      client.user.id,
      client.data.roomId,
      payload.id,
    );

    if (inventoryItems) {
      this.server.to(client.data.roomId).emit(client.event, { id: payload.id });

      client.emit('inventory:update-items', inventoryItems);
    }
  }
}
