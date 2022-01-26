export interface Movement {
  // Up
  u: boolean;
  // Right
  r: boolean;
  // Down
  d: boolean;
  // Left
  l: boolean;
  // Jumping
  j: boolean;
  // Climbing
  c: boolean;
}

export class PlayerMoveDto {
  entityId?: string;
  xpos: number;
  ypos: number;
  movement: Movement;
}
