export interface QueueJoinedPayload {
  position: number;
  message: string;
}



export interface MatchFoundPayload {
  matchId: string;
  roomCode: string;
  players: {
    id: string;
    name: string;
  }[];
  categories: string[];
  questionCount: number;
  durationSec: number;
}

export interface RoomCreatedPayload {
  matchId: string;
  roomCode: string;
  hostId: string;
}

export interface RoomJoinedPayload {
  matchId: string;
  roomCode: string;
  players: {
    id: string;
    name: string;
  }[];
  categories: string[];
  questionCount: number;
  durationSec: number;
}

export interface PlayerJoinedPayload {
  player: {
    id: string;
    name: string;
  };
  totalPlayers: number;
}

export interface RoomSettingsUpdatedPayload {
  categories: string[];
  questionCount: number;
  durationSec: number;
}

export interface ServerToClientEvents {
  // queue
  queue_joined: (payload: QueueJoinedPayload) => void;
  match_found: (payload: MatchFoundPayload) => void;
  queue_error: (message: string) => void;

  // room
  room_created: (payload: RoomCreatedPayload) => void;
  room_joined: (payload: RoomJoinedPayload) => void;
  player_joined: (payload: PlayerJoinedPayload) => void;
  room_settings_updated: (payload: RoomSettingsUpdatedPayload) => void;
  room_error: (message: string) => void;
  match_starting: (payload: MatchFoundPayload) => void;

submission_queued: (payload: { problemId: string; message: string }) => void
}

export interface ClientToServerEvents {
  // queue
  join_queue: () => void;
  leave_queue: () => void;

  // room
  create_room: (payload: {
    categories: string[];
    questionCount: number;
    durationSec: number;
  }) => void;
  join_room: (payload: { roomCode: string }) => void;
  leave_room: () => void;
  update_room_settings: (payload: {
    categories?: string[];
    questionCount?: number;
    durationSec?: number;
  }) => void;
  start_match: () => void;
}


