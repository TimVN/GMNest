import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Client } from '../_common/interfaces/client.interface';
import { PartyService } from './party.service';
import {Subscribe, TestDecorator} from '../_common/decorators/subscribe.decorator';
import { PartyEvents } from './party-events.enum';
import { PartyInviteDto } from './dtos/party-invite.dto';
import { PartyResponse, PartyResponseCode } from './dtos/party-response';
import { Server } from 'socket.io';
import { AcceptPartyInviteDto } from './dtos/accept-party-invite.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { Party } from './interfaces/party.interface';
import { TransferLeadershipDto } from './dtos/transfer-leadership.dto';
import { KickDto } from './dtos/kick.dto';

@WebSocketGateway()
export class PartyGateway {
  static ns = 'party';

  @WebSocketServer()
  private server: Server;

  constructor(private partyService: PartyService) {}

  /**
   * Event received when a user sends a party invite to another user
   * @param client
   * @param partyInviteDto
   */
  @Subscribe(PartyGateway.ns, PartyEvents.Invite)
  async partyInvite(client: Client, partyInviteDto: PartyInviteDto) {
    const otherUser = this.getSocketById(partyInviteDto.userId);

    if (!otherUser) {
      return new PartyResponse(PartyResponseCode.Error);
    }

    const response = await this.partyService.inviteToParty(
      client.id,
      partyInviteDto.userId,
    );

    if (response.code === PartyResponseCode.Success) {
      otherUser.emit(client.event, {
        userId: client.id,
        username: client.user.username,
      });
    }

    return response;
  }

  /**
   * Event received when a user accepts a party invite
   * @param client
   * @param acceptPartyInviteDto
   */
  @TestDecorator()
  @Subscribe(PartyGateway.ns, PartyEvents.Accept)
  async acceptPartyInvite(
    client: Client,
    acceptPartyInviteDto: AcceptPartyInviteDto,
  ) {
    const inviter = this.getSocketById(acceptPartyInviteDto.userId);

    if (!inviter) {
      return new PartyResponse(PartyResponseCode.Error);
    }

    let party: Party;
    try {
      party = await this.partyService.acceptPartyInvite(
        { id: inviter.id, username: inviter['user'].username },
        { id: client.id, username: client.user.username },
      );
    } catch (e) {
      console.log(e);
    }

    if (!party) {
      return;
    }

    party.members.forEach((member) => {
      this.server.sockets.to(member.id).emit('party:update', party);
    });

    inviter.emit(client.event, { userId: client.id });
  }

  /**
   * Event received when a player leaves a party
   * @param client
   */
  @Subscribe(PartyGateway.ns, PartyEvents.Leave)
  leaveParty(client: Client) {
    return this.partyService.leaveParty(client.id);
  }

  /**
   * Event received when a player transfer party leadership to another party member
   * @param client
   * @param transfer
   */
  @Subscribe(PartyGateway.ns, PartyEvents.TransferLeadership)
  async transferPartyLeadership(
    client: Client,
    transfer: TransferLeadershipDto,
  ) {
    await this.partyService.transferPartyLeadership(client.id, transfer.userId);
  }

  /**
   * Event received when a player is kicked from the party
   * @param client
   * @param kick
   */
  @Subscribe(PartyGateway.ns, PartyEvents.Kick)
  async kickFromParty(client: Client, kick: KickDto) {
    await this.partyService.kickFromParty(client.id, kick.userId);
  }

  /**
   * Helper function to get a user (socket) based on their socket id
   * @param socketId
   */
  getSocketById(socketId: string) {
    return this.server.sockets.sockets.get(socketId);
  }

  /**
   * The event fired when a user disconnects
   * @param client
   */
  async handleDisconnect(client: Client) {
    const partyId = await this.partyService.getPlayerPartyId(client.id);

    if (!partyId) {
      return;
    }

    const party = await this.partyService.leaveParty(client.id);

    if (party !== null) {
      this.server.sockets.to(party.id).emit('party:update', party);
    }
  }

  /**
   * Internal event used to signify party-members of updates to their party
   * @param party
   * @param partyId
   */
  @OnEvent('party.update')
  onPartyUpdate(party: Party, partyId: string = null) {
    this.server.sockets.to(party?.id || partyId).emit('party:update', party);
  }

  /**
   * Internal event used to subscribe party members to their private room
   * This room is used to send party updates and chat messages to its members
   * @param clientId
   * @param partyId
   */
  @OnEvent('party.join')
  onPartyJoin({ clientId, partyId }: { clientId: string; partyId: string }) {
    const client = this.getSocketById(clientId);

    if (client) {
      client.join(partyId);
    }
  }

  /**
   * Internal event used to unsubscribe a user from a party they just left
   * If all members leave, the room will be automatically deleted by Socket.IO
   * @param clientId
   * @param partyId
   */
  @OnEvent('party.leave')
  onPartyLeave({ clientId, partyId }: { clientId: string; partyId: string }) {
    const client = this.getSocketById(clientId);

    if (client) {
      client.leave(partyId);
    }
  }

  /**
   * Internal event fired when a player is kicked from a party
   * @param clientId
   * @param partyId
   */
  @OnEvent('party.kicked')
  onPartyKicked({ clientId, partyId }: { clientId: string; partyId: string }) {
    const client = this.getSocketById(clientId);

    if (client) {
      client.leave(partyId);
      client.emit('party:update', null);
    }
  }
}
