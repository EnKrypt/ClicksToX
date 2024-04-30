export enum STAGE {
  DISCONNECTED,
  WAITING_FOR_PLAYERS_TO_JOIN,
  PLAYING,
  FINISHED,
}

export interface State {
  stage: STAGE;
  timer: number;
  source: URL | undefined;
  destination: URL | undefined;
  connection: WebSocket | undefined;
  players: Array<{
    isSelf: boolean;
    isCreator: boolean;
    alias: string;
    submission: URL | undefined;
    tree: Node | undefined;
  }>;
  code: string;
}

export interface Node {
  article: URL;
  when: Date;
  children: Node[];
}

export const initialGameState: State = {
  stage: STAGE.DISCONNECTED,
  timer: 0,
  source: undefined,
  destination: undefined,
  connection: undefined,
  players: [],
  code: '',
};
