import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { PartyResponse, PartyResponseCode } from './dtos/party-response';
import { Party, PartyMember } from './interfaces/party.interface';
import { randomUUID } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PartyService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private eventEmitter: EventEmitter2,
  ) {
    this.cleanRedis();
  }

  async inviteToParty(inviter: string, invitee: string) {
    const inviteePartyId = await this.getPlayerPartyId(invitee);

    if (inviteePartyId) {
      return new PartyResponse(PartyResponseCode.Busy);
    }

    const inviterPartyId = await this.getPlayerPartyId(inviter);

    if (!inviterPartyId) {
      return new PartyResponse(PartyResponseCode.Success);
    }

    const party = await this.getParty(inviterPartyId);

    if (party && party.leaderId !== inviter) {
      return new PartyResponse(PartyResponseCode.Error);
    }

    return new PartyResponse(PartyResponseCode.Success);
  }

  async acceptPartyInvite(inviter: PartyMember, invitee: PartyMember) {
    const inviteePartyId = await this.getPlayerPartyId(invitee.id);

    if (inviteePartyId) {
      throw new PartyResponse(PartyResponseCode.Busy);
    }

    const inviterPartyId = await this.getPlayerPartyId(inviter.id);
    let party: Party;

    if (inviterPartyId) {
      party = await this.getParty(inviterPartyId);
    } else {
      party = await this.createParty(inviter);
      await this.setPlayerPartyId(inviter.id, party.id);
      this.eventEmitter.emit('party.join', {
        clientId: inviter.id,
        partyId: party.id,
      });
    }

    if (!party) {
      await this.deletePlayerPartyId(inviter.id);
      throw new PartyResponse(PartyResponseCode.Error);
    }

    if (party.members.length > 7) {
      throw new PartyResponse(PartyResponseCode.Full);
    }

    await this.setPlayerPartyId(invitee.id, party.id);

    party.members.push({
      id: invitee.id,
      username: invitee.username,
    });

    this.eventEmitter.emit('party.join', {
      clientId: invitee.id,
      partyId: party.id,
    });

    await this.updateParty(party);

    return party;
  }

  async transferPartyLeadership(leaderId: string, newOwnerId: string) {
    const partyId = await this.getPlayerPartyId(leaderId);

    if (!partyId) {
      throw new PartyResponse(PartyResponseCode.Error);
    }

    const party = await this.getParty(partyId);

    if (!party) {
      throw new PartyResponse(PartyResponseCode.Error);
    }

    if (!party.members.find((member) => member.id === newOwnerId)) {
      throw new PartyResponse(PartyResponseCode.Error);
    }

    party.leaderId = newOwnerId;

    await this.updateParty(party);

    this.eventEmitter.emit('party.update', party);
  }

  async leaveParty(userId: string) {
    const partyId = await this.getPlayerPartyId(userId);
    let party = await this.getParty(partyId);

    if (party) {
      this.eventEmitter.emit('party.leave', {
        clientId: userId,
        partyId,
      });

      party.members = party.members.filter((member) => member.id !== userId);

      if (userId === party.leaderId) {
        if (party.members.length > 0) {
          party.leaderId = party.members[0].id;
        } else {
          await this.deleteParty(party);
          party = null;
        }
      }

      this.eventEmitter.emit('party.update', party);

      if (party.members.length < 2) {
        this.eventEmitter.emit('party.update', null, partyId);
        this.eventEmitter.emit('party.leave', {
          clientId: party.members[0].id,
          partyId,
        });
        await this.deletePlayerPartyId(party.members[0].id);
        await this.deleteParty(party);

        party = null;
      } else {
        await this.updateParty(party);
      }
    }

    await this.deletePlayerPartyId(userId);

    return party;
  }

  async kickFromParty(ownerId: string, userToKickId: string) {
    const partyId = await this.getPlayerPartyId(ownerId);

    if (!partyId) {
      throw new PartyResponse(PartyResponseCode.Error);
    }

    let party = await this.getParty(partyId);

    if (!party) {
      throw new PartyResponse(PartyResponseCode.Error);
    }

    if (!party.members.find((member) => member.id === userToKickId)) {
      throw new PartyResponse(PartyResponseCode.Error);
    }

    party.members = party.members.filter(
      (member) => member.id !== userToKickId,
    );

    this.eventEmitter.emit('party.kicked', { clientId: userToKickId, partyId });

    await this.deletePlayerPartyId(userToKickId);

    if (party.members.length === 1) {
      await this.deleteParty(party);
      await this.deletePlayerPartyId(party.members[0].id);
      this.eventEmitter.emit('party.update', null, party.id);
      this.eventEmitter.emit('party.leave', {
        clientId: party.members[0].id,
        partyId,
      });
      party = null;
    } else {
      await this.updateParty(party);
    }

    this.eventEmitter.emit('party.update', party);
  }

  deletePlayerPartyId(userId: string) {
    return this.redis.del(`party_id_${userId}`);
  }

  setPlayerPartyId(userId: string, partyId: string) {
    return this.redis.set(`party_id_${userId}`, partyId);
  }

  getPlayerPartyId(userId: string) {
    return this.redis.get(`party_id_${userId}`);
  }

  async createParty(owner: PartyMember) {
    const party: Party = {
      id: randomUUID(),
      leaderId: owner.id,
      members: [owner],
      level: 1,
      experience: 0,
    };

    await this.redis.set(`party_${party.id}`, JSON.stringify(party));

    return party;
  }

  deleteParty(party: Party) {
    return this.redis.del(party.id);
  }

  updateParty(party: Party) {
    return this.redis.set(`party_${party.id}`, JSON.stringify(party));
  }

  async getParty(partyId: string): Promise<Party> {
    return JSON.parse(await this.redis.get(`party_${partyId}`));
  }

  async cleanRedis() {
    const [, keys] = await this.redis.scan(0, 'match', 'party_*');

    await Promise.all(keys.map((key) => this.redis.del(key)));
  }
}
