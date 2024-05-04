export enum STAGE {
  DISCONNECTED,
  WAITING_FOR_PLAYERS_TO_JOIN,
  PLAYING,
  FINISHED,
}

export interface State {
  stage: STAGE;
  timer: number;
  source: string | undefined;
  destination: string | undefined;
  players: Array<{
    isSelf: boolean;
    isCreator: boolean;
    alias: string;
    submission: string | undefined;
    tree: Node | undefined;
    visitCount: number;
    clickCount: number;
  }>;
  code: string;
}

export interface Node {
  article: string;
  when: Date;
  children: Node[];
}

export const initialGameState: State = {
  stage: STAGE.DISCONNECTED,
  timer: 0,
  source: undefined,
  destination: undefined,
  players: [],
  code: '',
};
