import { type WebSocket } from 'ws';
import config from './config.js';
import { clientToLobbyMapping } from './index.js';
import {
  broadcastToLobbyPlayers,
  shortestPathInTree,
  startGame,
} from './lobby.js';
import { handlePlayerError, logger } from './logging.js';
import { Lobby, Node } from './types.js';

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
  if (lobby.players.length < 2) {
    handlePlayerError({
      eventDescription: 'Could not end submission stage for lobby',
      reasonShownToPlayer: 'Cannot start a game without at least two players',
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

interface VisitPageRequest {
  client: WebSocket;
  parent: string;
  visited: string;
}

export const visitPage = ({ client, parent, visited }: VisitPageRequest) => {
  const lobby = clientToLobbyMapping.get(client);
  if (!lobby) {
    handlePlayerError({
      eventDescription: 'Could not update player navigation tree',
      reasonShownToPlayer:
        'Cannot navigate to pages for the game without being a player in a lobby first',
      client,
    });
    return false;
  }
  const player = lobby.players.find((player) => player.connection === client);
  if (!player) {
    handlePlayerError({
      eventDescription: 'Could not update player navigation tree',
      reasonShownToPlayer:
        'Could not find player state; rejoining to the lobby may be required',
      client,
    });
    return false;
  }
  const parentNode = player.tree
    ? findNodeInTree({ pathname: parent, node: player.tree })
    : undefined;
  if (!parentNode) {
    handlePlayerError({
      eventDescription: 'Could not update player navigation tree',
      reasonShownToPlayer:
        'Could not find parent node in the existing navigation tree',
      client,
    });
    return false;
  }
  for (const node of parentNode.children) {
    if (node.article.pathname === visited) {
      // Node already exists, we don't need to add it to the tree
      return;
    }
  }
  parentNode.children.push({
    article: new URL(`https://${config.wikipediaHost}${visited}`),
    when: new Date(),
    children: [],
  });
  player.visitCount = player.visitCount + 1;
  broadcastToLobbyPlayers({
    message: `VISIT_COUNT ${player.alias} ${player.visitCount}`,
    code: lobby.code,
  });

  // If this is the destination page, then calculate click count
  if (visited === lobby.state.destination?.pathname) {
    const clickCount = player.tree
      ? shortestPathInTree({
          count: -1,
          destinationPathname: lobby.state.destination.pathname,
          tree: player.tree.children,
        })
      : -1;
    if (
      player.shortestClickCount !== -1 &&
      clickCount < player.shortestClickCount
    ) {
      player.shortestClickCount = clickCount;
      broadcastToLobbyPlayers({
        message: `NEW_CLICK_COUNT ${player.alias} ${clickCount}`,
        code: lobby.code,
      });
    }
  }
};

interface FindNodeInTreeRequest {
  pathname: string;
  node: Node;
}

const findNodeInTree = ({
  pathname,
  node,
}: FindNodeInTreeRequest): Node | undefined => {
  if (node.article.pathname === pathname) {
    return node;
  }
  if (node.children.length) {
    for (const childNode of node.children) {
      const targetNode = findNodeInTree({ pathname, node: childNode });
      if (targetNode) {
        return targetNode;
      }
    }
  }
  return undefined;
};
