import { type WebSocket } from 'ws';
import config from './config.js';
import { clientToLobbyMapping } from './index.js';
import { broadcastToLobbyPlayers, startGame } from './lobby.js';
import { handlePlayerError, logger } from './logging.js';
import { Lobby } from './types.js';

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
        'Could not find player state; rejoining the lobby may be required',
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

interface EndSubmissionRequest {
  client: WebSocket;
}

export const endSubmission = async ({ client }: EndSubmissionRequest) => {
  const lobby = clientToLobbyMapping.get(client);
  if (!lobby) {
    handlePlayerError({
      eventDescription: 'Could not end submission stage for lobby',
      reasonShownToPlayer:
        'Cannot end submission stage without being a player in a lobby first',
      client,
    });
    return false;
  }
  const player = lobby.players.find((player) => player.connection === client);
  if (!player) {
    handlePlayerError({
      eventDescription: 'Could not end submission stage for lobby',
      reasonShownToPlayer:
        'Could not find player state; rejoining to the lobby may be required',
      client,
    });
    return false;
  }
  if (!player.isCreator) {
    handlePlayerError({
      eventDescription: 'Could not end submission stage for lobby',
      reasonShownToPlayer: 'Only the lobby creator can end submission stage',
      client,
    });
    return false;
  }

  // Now we set the source and destination pages before starting the game
  await setPages({ lobby });
  startGame({ lobby });
};

interface SetPagesRequest {
  lobby: Lobby;
}

const setPages = async ({ lobby }: SetPagesRequest) => {
  const randomPage = (await (
    await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary')
  ).json()) as { content_urls: { desktop: { page: string } } };
  const source = new URL(randomPage.content_urls.desktop.page);
  let destination = new URL(
    `https://${config.wikipediaHost}/wiki/Shia_LaBeouf` // Actual Cannibal
  );
  const submissions = lobby.players
    .map((player) => player.submission)
    .filter((submission) => (submission ? true : false)) as URL[];
  if (submissions.length > 0) {
    destination = submissions[Math.floor(Math.random() * submissions.length)];
  }
  lobby.state.source = source;
  lobby.state.destination = destination;
};
