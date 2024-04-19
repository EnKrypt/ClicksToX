import { type WebSocket } from 'ws';
import config from './config.js';
import { clientToLobbyMapping } from './index.js';
import { broadcastToLobbyPlayers } from './lobby.js';
import { handlePlayerError, logger } from './logging.js';

interface SubmitDestinationPageCandidateRequest {
  client: WebSocket;
  submission: string;
}

export const submitDestinationPageCandidate = ({
  client,
  submission,
}: SubmitDestinationPageCandidateRequest) => {
  const lobby = clientToLobbyMapping.get(client);
  if (!lobby) {
    handlePlayerError({
      eventDescription: 'Could not submit destination page candidate',
      reasonShownToPlayer:
        'Cannot submit destination page candidate without being a player in a lobby first',
      client,
    });
    return false;
  }
  const submissionPathName = new URL(submission).pathname;
  const candidate = new URL(
    `https://${config.wikipediaHost}${submissionPathName}`
  );
  const player = lobby.players.find((player) => player.connection === client);
  if (!player) {
    handlePlayerError({
      eventDescription: 'Could not submit destination page candidate',
      reasonShownToPlayer:
        'Could not update player state; rejoining to the lobby may be required',
      client,
    });
    return false;
  }
  player.submission = candidate;
  logger.verbose(
    `Broadcasting destination page submission of player '${player.alias}' to lobby '${lobby.code}'`
  );
  broadcastToLobbyPlayers({
    message: `SUBMIT ${player.alias} ${candidate.href}`,
    code: lobby.code,
  });
};
