import { WebSocket } from 'ws';

export enum STAGE {
  WAITING_FOR_PLAYERS_TO_JOIN,
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
    tree: Node | undefined;
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

export interface Node {
  article: URL;
  when: Date;
  children: Node[];
}
