import { type IncomingMessage } from 'node:http';
import { type WebSocket } from 'ws';
import config from './config.js';
import { clientToLobbyMapping, codeToLobbyMapping } from './index.js';
import { broadcastPlayerListing } from './lobby.js';
import { handlePlayerError, logger } from './logging.js';
import { STAGE } from './types.js';

interface AddPlayerToLobbyRequest {
  client: WebSocket;
  request: IncomingMessage;
  code: string;
  alias: string;
  isCreator: boolean;
}

export const addPlayerToLobby = ({
  client,
  request,
  code,
  alias,
  isCreator,
}: AddPlayerToLobbyRequest) => {
  logger.verbose(
    `Adding client with IP: ${getIpAddress(request)}, X-Forwarded-For: ${(request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim()} to lobby '${code}'`
  );

  const badLobby = clientToLobbyMapping.get(client);
  if (badLobby) {
    handlePlayerError({
      eventDescription: `Cannot add player '${alias}' to lobby '${code}'`,
      reasonShownToPlayer: `Connection already exists in lobby '${badLobby.code}' as player '${badLobby.players.find((player) => player.connection === client)?.alias ?? 'NO_ALIAS'}'`,
      client,
    });
    return;
  }

  const lobby = codeToLobbyMapping.get(code);
  if (!lobby) {
    handlePlayerError({
      eventDescription: `Cannot add player '${alias}' to lobby '${code}'`,
      reasonShownToPlayer: `Lobby '${code}' does not exist`,
      client,
    });
    return;
  }

  for (const player of lobby.players) {
    if (player.connection === client) {
      handlePlayerError({
        eventDescription: `Cannot add player '${alias}' to lobby '${code}'`,
        reasonShownToPlayer: `Connection already exists to the same lobby`,
        client,
      });
      return;
    }
    if (player.alias === alias) {
      handlePlayerError({
        eventDescription: `Cannot add player '${alias}' to lobby '${code}'`,
        reasonShownToPlayer: `Player already exists in the lobby with the same alias`,
        client,
      });
      return;
    }
  }

  if (lobby.players.length >= config.lobbyPlayerLimit) {
    handlePlayerError({
      eventDescription: `Cannot add player '${alias}' to lobby '${code}'`,
      reasonShownToPlayer: `Lobby is at maximum player limit`,
      client,
    });
    return;
  }

  if (lobby.state.stage !== STAGE.WAITING_FOR_PLAYERS_TO_JOIN) {
    handlePlayerError({
      eventDescription: `Cannot add player '${alias}' to lobby '${code}'`,
      reasonShownToPlayer: `Lobby has a game already in progress`,
      client,
    });
    return;
  }

  lobby.players.push({
    isCreator,
    alias,
    connection: client,
    submission: undefined,
    tree: undefined,
    visitCount: 0,
    shortestClickCount: { count: -1, when: new Date() },
  });
  clientToLobbyMapping.set(client, lobby);
  broadcastPlayerListing({ code: lobby.code });
  for (const player of lobby.players) {
    if (player.submission) {
      client.send(`SUBMIT ${player.alias} ${player.submission}`);
    }
  }
};

interface RemovePlayerRequest {
  client: WebSocket;
  request: IncomingMessage;
}

export const removePlayer = ({ client, request }: RemovePlayerRequest) => {
  logger.verbose(
    `Removing client with IP: ${getIpAddress(request)}, X-Forwarded-For: ${(request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim()}`
  );

  const lobby = clientToLobbyMapping.get(client);
  if (lobby) {
    let wasLobbyLeader = false;
    lobby.players = lobby.players.filter((player) => {
      if (player.connection === client) {
        if (player.isCreator) {
          wasLobbyLeader = true;
        }
        logger.verbose(
          `Removing player '${player.alias}' from lobby '${lobby.code}'`
        );
        return false;
      }
      return true;
    });

    if (!lobby.players.length) {
      logger.verbose(
        `Removing lobby '${lobby.code}' due to no connected players`
      );
      codeToLobbyMapping.delete(lobby.code);
    } else {
      if (wasLobbyLeader) {
        lobby.players[0].isCreator = true;
      }
      broadcastPlayerListing({ code: lobby.code });
    }

    clientToLobbyMapping.delete(client);
  }

  client.terminate();
};

const getIpAddress = (request: IncomingMessage): string => {
  let ipAddress = 'INVALID';
  const remoteAddress = request.socket.remoteAddress;
  const addressInfo = request.socket.address();
  if ('address' in addressInfo) {
    ipAddress = addressInfo.address;
  } else if (remoteAddress) {
    ipAddress = remoteAddress;
  }
  return ipAddress;
};
