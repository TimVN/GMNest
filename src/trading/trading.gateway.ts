import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { InventoryService } from '../inventory/inventory.service';
import { Subscribe } from '../_common/decorators/subscribe.decorator';
import { TradingEvents } from './trading-events.enum';
import { Client } from '../_common/interfaces/client.interface';
import { TradingProposalDto } from './dtos/trading-proposal.dto';
import { Server } from 'socket.io';
import { TradingResponse, TradingResponseCode } from './dtos/tradingResponse';
import { TradingService } from './trading.service';
import { AcceptProposalDto } from './dtos/accept-proposal.dto';
import { AddItemDto } from './dtos/add-item.dto';

@WebSocketGateway()
export class TradingGateway {
  static ns = 'trading';

  @WebSocketServer()
  private server: Server;

  constructor(
    private service: TradingService,
    private inventoryService: InventoryService,
  ) {}

  @Subscribe(TradingGateway.ns, TradingEvents.Propose)
  async proposeTrade(client: Client, proposalDto: TradingProposalDto) {
    await this.service.test(client.id, proposalDto.userId);
    const otherPlayer = this.getUserBySocketId(proposalDto.userId);

    if (!otherPlayer) {
      return new TradingResponse(TradingResponseCode.Error);
    }

    const userInTrade = await this.service.isUserInTrade(proposalDto.userId);

    if (userInTrade) {
      return new TradingResponse(TradingResponseCode.Busy);
    }

    const userAwaitingAcceptance = await this.service.getUserAwaitingAcceptance(
      proposalDto.userId,
    );

    if (userAwaitingAcceptance) {
      return new TradingResponse(TradingResponseCode.Busy);
    }

    const proposal = {
      username: client.data.username,
      userId: client.id,
    };

    await this.service.setUserAwaitingAcceptance(client.id, proposalDto.userId);

    this.server.sockets.to(proposalDto.userId).emit(client.event, proposal);

    return new TradingResponse(TradingResponseCode.Success);
  }

  @Subscribe(TradingGateway.ns, TradingEvents.AcceptProposal)
  async acceptProposal(client: Client, acceptDto: AcceptProposalDto) {
    const userInTrade = await this.service.isUserInTrade(client.id);

    if (userInTrade) {
      return new TradingResponse(TradingResponseCode.Busy);
    }

    const otherUserAwaitingAcceptance =
      await this.service.getUserAwaitingAcceptance(acceptDto.userId);

    if (
      otherUserAwaitingAcceptance &&
      otherUserAwaitingAcceptance !== client.id
    ) {
      return new TradingResponse(TradingResponseCode.Busy);
    }

    await this.service.setUserInTrade(client.id, acceptDto.userId);
    await this.service.setUserInTrade(acceptDto.userId, client.id);

    this.server.sockets.to(acceptDto.userId).emit(client.event);
    client.emit(client.event);

    return new TradingResponse(TradingResponseCode.Success);
  }

  @Subscribe(TradingGateway.ns, TradingEvents.Cancel)
  async cancelTrade(client: Client) {
    const userInTrade = await this.service.isUserInTrade(client.id);

    if (!userInTrade) {
      return;
    }

    this.server.sockets.to(userInTrade).emit(client.event);

    return new TradingResponse(TradingResponseCode.Success);
  }

  @Subscribe(TradingGateway.ns, TradingEvents.AddItem)
  async addItem(client: Client, addItemDto: AddItemDto) {
    const userInTrade = await this.service.isUserInTrade(client.id);

    if (!userInTrade) {
      return;
    }

    const item = await this.service.addItem(client.id, addItemDto.id);

    if (!item) {
      return new TradingResponse(TradingResponseCode.Error);
    }

    this.server.sockets
      .to(userInTrade)
      .emit(client.event, { mine: false, item });
    client.emit(client.event, { mine: true, item });

    return new TradingResponse(TradingResponseCode.Success);
  }

  getUserBySocketId(userId: string) {
    return this.server.sockets.sockets.get(userId);
  }

  async handleDisconnect(client: Client) {
    const userInTrade = await this.service.isUserInTrade(client.id);

    if (!userInTrade) {
      return;
    }

    await this.service.clearTrade(client.id);
    await this.service.clearTrade(userInTrade);

    this.server.sockets
      .to(userInTrade)
      .emit(`${TradingGateway.ns}:${TradingEvents.Cancel}`);
  }
}
