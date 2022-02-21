export interface PartyMember {
  username: string;
  id: string;
}

export interface Party {
  id: string;
  leaderId: string;
  members: PartyMember[];
  level: number;
  experience: number;
}
