import { type WebSocket } from 'ws';
import { clientToLobbyMapping, codeToLobbyMapping } from './index.js';
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
        roundTimeLimit,
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
  for (const broadcastingPlayer of lobby.players) {
    broadcastingPlayer.connection.send(
      `PLAYERS ${lobby.code} ${lobby.state.timer} ${lobby.players
        .map((player) => {
          if (
            player.isCreator &&
            player.connection === broadcastingPlayer.connection
          ) {
            return `~${player.alias}`;
          }
          if (player.isCreator) {
            return `!${player.alias}`;
          }
          if (player.connection === broadcastingPlayer.connection) {
            return `@${player.alias}`;
          }
          return player.alias;
        })
        .join(',')}`
    );
  }
};

interface StartGameRequest {
  lobby: Lobby;
}

export const startGame = ({ lobby }: StartGameRequest) => {
  lobby.state.stage = STAGE.PLAYING;
  for (const player of lobby.players) {
    player.tree = {
      article: new URL(lobby.state.source ?? ''),
      when: new Date(),
      children: [],
    };
  }
  broadcastToLobbyPlayers({
    message: `PLAYING ${lobby.state.source?.href} ${lobby.state.destination?.href}`,
    code: lobby.code,
  });
  const intervalId = setInterval(() => {
    if (
      lobby.state.timer <= 0 ||
      !codeToLobbyMapping.get(lobby.code) ||
      lobby.players.length <= 1
    ) {
      clearTimeout(intervalId);
      endGame({ lobby });
    }
    lobby.state.timer = lobby.state.timer - 1;
    broadcastToLobbyPlayers({
      message: `TIMER ${lobby.state.timer + 1}`,
      code: lobby.code,
    });
  }, 1000);
};

interface EndGameRequest {
  lobby: Lobby;
}

const endGame = ({ lobby }: EndGameRequest) => {
  lobby.state.stage = STAGE.FINISHED;
  broadcastToLobbyPlayers({
    message: `FINISH ${JSON.stringify(lobby.players.map((player) => ({ alias: player.alias, tree: player.tree })))}`,
    code: lobby.code,
  });
};

interface ShortestPathInTreeRequest {
  count: number;
  destinationPathname: string;
  tree: Node[];
}

export const shortestPathInTree = ({
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

interface ResetLobbyRequest {
  client: WebSocket;
}

export const resetLobby = ({ client }: ResetLobbyRequest) => {
  const lobby = clientToLobbyMapping.get(client);
  if (!lobby) {
    handlePlayerError({
      eventDescription: 'Could not reset lobby for a new game',
      reasonShownToPlayer:
        'Cannot reset lobby without being a player in a lobby first',
      client,
    });
    return false;
  }
  if (lobby.state.stage !== STAGE.FINISHED) {
    handlePlayerError({
      eventDescription: 'Could not reset lobby for a new game',
      reasonShownToPlayer:
        'Cannot reset a lobby until it is just finished a game',
      client,
    });
    return false;
  }
  const player = lobby.players.find((player) => player.connection === client);
  if (!player) {
    handlePlayerError({
      eventDescription: 'Could not reset lobby for a new game',
      reasonShownToPlayer:
        'Could not find player state; rejoining to the lobby may be required',
      client,
    });
    return false;
  }
  if (!player.isCreator) {
    handlePlayerError({
      eventDescription: 'Could not reset lobby for a new game',
      reasonShownToPlayer:
        'Only the lobby leader can reset the lobby for a new game',
      client,
    });
    return false;
  }
  lobby.state.stage = STAGE.WAITING_FOR_PLAYERS_TO_JOIN;
  lobby.state.source = undefined;
  lobby.state.destination = undefined;
  lobby.state.timer = lobby.roundTimeLimit;
  for (const player of lobby.players) {
    player.shortestClickCount = { count: -1, when: new Date() };
    player.visitCount = 0;
    player.submission = undefined;
    player.tree = undefined;
  }
  broadcastPlayerListing({ code: lobby.code });
};
