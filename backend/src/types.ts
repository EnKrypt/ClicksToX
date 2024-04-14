import { WebSocket } from 'ws';

export enum STAGE {
  WAITING_FOR_PLAYERS_TO_JOIN,
  SUBMITTING_DESTINATION,
  PLAYING,
  FINISHED,
}

export interface Lobby {
  state: State;
  players: Array<{
    isCreator: boolean;
    alias: string;
    connection: WebSocket;
    submission: URL | undefined;
  }>;
  code: string;
  createdAt: Date;
}

export interface State {
  stage: STAGE;
  timer: number;
  source: URL | undefined;
  destination: URL | undefined;
}
