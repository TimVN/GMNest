import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { InventoryService } from '../inventory/inventory.service';
import { Subscribe } from '../_common/decorators/subscribe.decorator';
import { TradingEvents } from './trading-events.enum';
import { Client } from '../_common/interfaces/client.interface';
import { TradingProposalDto } from './dtos/trading-proposal.dto';
import { Server } from 'socket.io';
import { TradingResponse, TradingResponseCode } from './dtos/trading-response';
import { TradingService } from './trading.service';
import { AcceptProposalDto } from './dtos/accept-proposal.dto';
import { AddItemDto } from './dtos/add-item.dto';
import { LockTradeDto } from './dtos/lock-trade.dto';
import { ConfirmTradeDto } from './dtos/confirm-trade.dto';
import { InventoryItem } from '../_common/database/entities/inventory.entity';

@WebSocketGateway()
export class TradingGateway {
  static ns = 'trading';

  @WebSocketServer()
  private server: Server;

  constructor(
    private service: TradingService,
    private inventoryService: InventoryService,
  ) {}

  /**
   * Method executed when a player wants to trade another user
   * @param client
   * @param proposalDto
   */
  @Subscribe(TradingGateway.ns, TradingEvents.Propose)
  async proposeTrade(client: Client, proposalDto: TradingProposalDto) {
    // We try to find the other player, the userId is actually a socket-id
    const otherPlayer = this.getUserBySocketId(proposalDto.userId);

    // If they're not connected, respond with an error
    if (!otherPlayer) {
      return new TradingResponse(TradingResponseCode.Error);
    }

    // First we check if the user is already trading
    const userInTrade = await this.service.getUserInTrade(proposalDto.userId);

    // We can't trade with 2 players at the same time, respond with 'busy'
    if (userInTrade) {
      return new TradingResponse(TradingResponseCode.Busy);
    }

    // Does this user have a pending trade-request?
    const userAwaitingAcceptance = await this.service.getUserAwaitingAcceptance(
      proposalDto.userId,
    );

    // If so, respond with 'busy'
    if (userAwaitingAcceptance) {
      return new TradingResponse(TradingResponseCode.Busy);
    }

    const proposal = {
      username: client.data.username,
      userId: client.id,
    };

    // This reservation lasts 10 seconds, after which another player can request to trade this user
    await this.service.setUserAwaitingAcceptance(client.id, proposalDto.userId);

    // Tell the other user about our request
    this.server.sockets.to(proposalDto.userId).emit(client.event, proposal);

    return new TradingResponse(TradingResponseCode.Success);
  }

  /**
   * Accepts a trade request
   * @param client
   * @param acceptDto
   */
  @Subscribe(TradingGateway.ns, TradingEvents.AcceptProposal)
  async acceptProposal(client: Client, acceptDto: AcceptProposalDto) {
    // If the user trying to accept the request is already trading...
    const userInTrade = await this.service.getUserInTrade(client.id);

    // Respond with 'busy'
    if (userInTrade) {
      return new TradingResponse(TradingResponseCode.Busy);
    }

    // We check if the pending request is coming from the party accepting the request
    const otherUserAwaitingAcceptance =
      await this.service.getUserAwaitingAcceptance(acceptDto.userId);

    if (
      otherUserAwaitingAcceptance &&
      otherUserAwaitingAcceptance !== client.id
    ) {
      return new TradingResponse(TradingResponseCode.Busy);
    }

    // Lock both parties in a trade with each other
    await this.service.setUserInTrade(client.id, acceptDto.userId);
    await this.service.setUserInTrade(acceptDto.userId, client.id);

    // Let them know the trade is open
    this.server.sockets
      .to(acceptDto.userId)
      .emit(client.event, { userId: client.id });
    client.emit(client.event, { userId: acceptDto.userId });

    return new TradingResponse(TradingResponseCode.Success);
  }

  /**
   * Adds an item to the trade
   * @param client
   * @param addItemDto
   */
  @Subscribe(TradingGateway.ns, TradingEvents.AddItem)
  async addItem(client: Client, addItemDto: AddItemDto) {
    // Our usual check
    const userInTrade = await this.service.getUserInTrade(client.id);

    if (!userInTrade) {
      return;
    }

    // See the addItem method for further info
    const item = await this.service.addItem(
      client.id,
      userInTrade,
      addItemDto.id,
      addItemDto.amount,
    );

    // The addItem function can return void for several reasons
    // If we didn't succeed, tell the user
    if (!item) {
      return new TradingResponse(TradingResponseCode.Error);
    }

    item.amount = addItemDto.amount || 1;

    // Tell both parties the item was added
    // The payload caries a "mine" property to indicate who offered the item
    this.server.sockets
      .to(userInTrade)
      .emit(client.event, { mine: false, item });
    client.emit(client.event, { mine: true, item });

    return new TradingResponse(TradingResponseCode.Success);
  }

  /**
   * Locks the trade for 1 party
   * After this, neither party can add any more items
   * @param client
   * @param lockTradeDto
   */
  @Subscribe(TradingGateway.ns, TradingEvents.Lock)
  async lockTrade(client: Client, lockTradeDto: LockTradeDto) {
    const userInTrade = await this.service.getUserInTrade(client.id);

    if (!userInTrade) {
      return new TradingResponse(TradingResponseCode.Error);
    }

    // This should never occur, but we check nonetheless
    if (userInTrade !== lockTradeDto.userId) {
      return new TradingResponse(TradingResponseCode.Error);
    }

    // We lock the trade for the user that requested to do so
    await this.service.lockTrade(client.id);

    // And tell the other party that we've locked the trade on our end
    this.server.sockets.to(lockTradeDto.userId).emit(client.event);

    return new TradingResponse(TradingResponseCode.Success);
  }

  @Subscribe(TradingGateway.ns, TradingEvents.Confirm)
  async confirmTrade(client: Client, confirmTradeDto: ConfirmTradeDto) {
    const userInTrade = await this.service.getUserInTrade(client.id);

    if (!userInTrade) {
      return new TradingResponse(TradingResponseCode.Error);
    }

    // This should never occur, but we check nonetheless
    if (userInTrade !== confirmTradeDto.userId) {
      await this.cancelTrade(client);
      return new TradingResponse(TradingResponseCode.Error);
    }

    const theirItemsInTrade = await this.service.getItemsInTrade(userInTrade);

    // The following is a check to confirm the client is seeing the same items as we've kept track of
    // The DTO contains an array of TradeItems, which have an item ID and amount
    if (confirmTradeDto.items.length !== theirItemsInTrade.length) {
      await this.cancelTrade(client);
      return new TradingResponse(TradingResponseCode.Error);
    }

    const confirmedItemsInTrade = confirmTradeDto.items.filter((item) =>
      theirItemsInTrade.find(
        (i) => i.id === item.id && i.amount === item.amount,
      ),
    );

    if (confirmedItemsInTrade.length !== theirItemsInTrade.length) {
      await this.cancelTrade(client);
      return new TradingResponse(TradingResponseCode.Error);
    }

    // We're good. Now we check if both parties confirmed the trade
    // If so, we swap the items
    const otherConfirmedWith = await this.service.getUserConfirmedTrade(
      userInTrade,
    );

    // If we're the first to confirm, there's no need to proceed
    // We mark it as confirmed, and return a success code
    if (!otherConfirmedWith) {
      await this.service.setUserConfirmedTrade(client.id, userInTrade);

      return new TradingResponse(TradingResponseCode.Success);
    }

    const otherUser = this.getUserBySocketId(userInTrade);

    if (!otherUser) {
      await this.cancelTrade(client);
      return new TradingResponse(TradingResponseCode.Error);
    }

    const myItemsInTrade = await this.service.getItemsInTrade(client.id);

    // No items offered, no reason to continue
    if (theirItemsInTrade.length === 0 && myItemsInTrade.length === 0) {
      await this.cancelTrade(client);

      return;
    }

    // We've done every possible check, lets complete the trade
    if (otherConfirmedWith === client.id) {
      // Complete the trade!
      const myInventory = await this.inventoryService.getInventory(
        client.user.id,
      );
      const theirInventory = await this.inventoryService.getInventory(
        otherUser['user'].id,
      );

      const myOffer =
        myItemsInTrade.length > 0
          ? await this.inventoryService.getInventoryItems(
              myItemsInTrade.map((item) => item.id),
            )
          : [];
      const theirOffer =
        theirItemsInTrade.length > 0
          ? await this.inventoryService.getInventoryItems(
              theirItemsInTrade.map((item) => item.id),
            )
          : [];

      const transaction = [];

      const myUpdatedItems = [];
      const myAddedItems = [];
      const theirUpdatedItems = [];
      const theirAddedItems = [];

      myOffer.forEach((item) => {
        const tradeItem = myItemsInTrade.find((i) => i.id === item.id);

        // This is a simple swap of ownership
        if (tradeItem.amount === item.amount) {
          item.inventory = theirInventory;
          myUpdatedItems.push({ id: tradeItem.id, amount: 0 });
          theirAddedItems.push(item);
        } else {
          item.amount -= tradeItem.amount;

          const newItem = new InventoryItem();

          newItem.amount = tradeItem.amount;
          newItem.inventory = theirInventory;
          newItem.item = item.item;

          myUpdatedItems.push({ id: tradeItem.id, amount: item.amount });
          theirAddedItems.push(newItem);

          transaction.push(this.inventoryService.updateInventoryItem(newItem));
        }

        transaction.push(this.inventoryService.updateInventoryItem(item));
      });

      theirOffer.forEach((item) => {
        const tradeItem = theirItemsInTrade.find((i) => i.id === item.id);

        // This is a simple swap of ownership
        if (tradeItem.amount === item.amount) {
          item.inventory = myInventory;
          theirUpdatedItems.push({ id: tradeItem.id, amount: 0 });
          myAddedItems.push(item);
        } else {
          item.amount -= tradeItem.amount;

          const newItem = new InventoryItem();

          newItem.amount = tradeItem.amount;
          newItem.inventory = myInventory;
          newItem.item = item.item;

          myAddedItems.push(newItem);
          theirUpdatedItems.push({ id: tradeItem.id, amount: item.amount });

          transaction.push(this.inventoryService.updateInventoryItem(newItem));
        }

        transaction.push(this.inventoryService.updateInventoryItem(item));
      });

      client.emit('inventory:update', myUpdatedItems);
      client.emit('inventory:add', myAddedItems);

      otherUser.emit('inventory:update', theirUpdatedItems);
      otherUser.emit('inventory:add', theirAddedItems);

      await Promise.all(transaction).catch((e) => {
        console.log(e);
      });

      await this.cancelTrade(client);
    }
  }

  /**
   * Cancels a trade
   * @param client
   */
  @Subscribe(TradingGateway.ns, TradingEvents.Cancel)
  async cancelTrade(client: Client) {
    // If we're not trading, ignore the event
    const userInTrade = await this.service.getUserInTrade(client.id);

    if (!userInTrade) {
      return;
    }

    // Else, we clear the trade-lock, items etc.
    await this.service.clearTrade(client.id);
    await this.service.clearTrade(userInTrade);

    // Tell the other user we cancelled :(
    this.server.sockets
      .to(userInTrade)
      .emit(`${TradingGateway.ns}:${TradingEvents.Cancel}`);
    client.emit(`${TradingGateway.ns}:${TradingEvents.Cancel}`);

    // Tell the player cancelling the trade that we succeeded
    return new TradingResponse(TradingResponseCode.Success);
  }

  getUserBySocketId(userId: string) {
    return this.server.sockets.sockets.get(userId);
  }

  async handleDisconnect(client: Client) {
    await this.cancelTrade(client);
  }
}
