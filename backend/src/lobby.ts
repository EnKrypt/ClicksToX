import { type WebSocket } from 'ws';
import { codeToLobbyMapping } from './index.js';
import { handlePlayerError, logger } from './logging.js';
import { Lobby, Node, STAGE } from './types.js';

const MAX_ATTEMPTS_TO_CREATE_UNIQUE_LOBBY_CODE = 3;
const LOBBY_CODE_SIZE = 4; // Must be < 10

interface CreateLobbyRequest {
  client: WebSocket;
  roundTimeLimit: number;
}

export const createLobby = ({
  client,
  roundTimeLimit,
}: CreateLobbyRequest): string => {
  for (let i = 0; i < MAX_ATTEMPTS_TO_CREATE_UNIQUE_LOBBY_CODE; i++) {
    /* Beware: Math.random is not cryptographically secure. There's no auth/security here, so it's okay.
     * On a macroscopic level, the distribution of each invocation could represent some variation of
     * https://en.wikipedia.org/wiki/Sierpi%C5%84ski_triangle#Chaos_game
     * Again, we don't care about the distribution being truly even so this is still okay.
     */
    const code = Math.random()
      .toString(36)
      .substring(2, 2 + LOBBY_CODE_SIZE);
    if (!codeToLobbyMapping.has(code)) {
      codeToLobbyMapping.set(code, {
        state: {
          stage: STAGE.WAITING_FOR_PLAYERS_TO_JOIN,
          timer: roundTimeLimit,
          source: undefined,
          destination: undefined,
        },
        players: [],
        code,
        createdAt: new Date(),
      });
      return code;
    }
  }
  handlePlayerError({
    eventDescription: 'Could not create a new lobby',
    reasonShownToPlayer:
      'Exceeded attempts to generate a unique lobby code; there may be too many simultaneous games in progress',
    client,
  });
  return '';
};

interface BroadcastToLobbyPlayersRequest {
  message: string;
  code: string;
}

export const broadcastToLobbyPlayers = ({
  message,
  code,
}: BroadcastToLobbyPlayersRequest) => {
  logger.verbose(`Broadcasting to lobby '${code}': ${message}`);
  const lobby = codeToLobbyMapping.get(code);
  if (!lobby) {
    logger.warn('Cannot broadcast to nonexistent lobby');
    return;
  }
  for (const player of lobby.players) {
    player.connection.send(message);
  }
};

interface BroadcastPlayerListingRequest {
  code: string;
}

export const broadcastPlayerListing = ({
  code,
}: BroadcastPlayerListingRequest) => {
  logger.verbose(`Broadcasting updated player listing to lobby '${code}'`);
  const lobby = codeToLobbyMapping.get(code);
  if (!lobby) {
    logger.warn('Cannot broadcast player listing to nonexistent lobby');
    return;
  }
  broadcastToLobbyPlayers({
    message: `PLAYERS ${lobby.code} ${lobby.state.timer} ${lobby.players.map((player) => player.alias).join(',')}`,
    code,
  });
};

interface StartGameRequest {
  lobby: Lobby;
}

export const startGame = ({ lobby }: StartGameRequest) => {
  lobby.state.stage = STAGE.PLAYING;
  broadcastToLobbyPlayers({
    message: `PLAYING ${lobby.state.source} ${lobby.state.destination}`,
    code: lobby.code,
  });
  const intervalId = setInterval(() => {
    if (lobby.state.timer === 0) {
      clearTimeout(intervalId);
      endGame({ lobby });
    }
    lobby.state.timer = lobby.state.timer - 1;
  }, 1000);
};

interface EndGameRequest {
  lobby: Lobby;
}

const endGame = ({ lobby }: EndGameRequest) => {
  lobby.state.stage = STAGE.FINISHED;
  const shortestPath = { count: Infinity, alias: '' };
  for (const player of lobby.players) {
    const shortestCountOfPlayer = player.tree
      ? shortestPathInTree({
          count: -1,
          destinationPathname: lobby.state.destination?.pathname as string,
          tree: player.tree.children,
        })
      : -1;
    if (
      shortestCountOfPlayer !== -1 &&
      shortestCountOfPlayer < shortestPath.count
    ) {
      shortestPath.count = shortestCountOfPlayer;
      shortestPath.alias = player.alias;
    }
  }
  if (shortestPath.alias) {
    broadcastToLobbyPlayers({
      message: `FINISH ${shortestPath.count},${shortestPath.alias}`,
      code: lobby.code,
    });
    return;
  }
  // Nobody finished, so no winner
  broadcastToLobbyPlayers({
    message: `FINISH -1`,
    code: lobby.code,
  });
};

interface ShortestPathInTreeRequest {
  count: number;
  destinationPathname: string;
  tree: Node[];
}

const shortestPathInTree = ({
  count,
  destinationPathname,
  tree,
}: ShortestPathInTreeRequest): number => {
  const counts = [];
  for (const node of tree) {
    if (node.article.pathname === destinationPathname) {
      return count + 1;
    }
    counts.push(
      shortestPathInTree({
        count: count + 1,
        destinationPathname,
        tree: node.children,
      })
    );
  }
  const filteredCounts = counts.filter((count) => count !== -1);
  if (filteredCounts.length) {
    return Math.min(...filteredCounts);
  }
  return -1;
};
