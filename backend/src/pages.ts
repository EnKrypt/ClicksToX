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
      reasonShownToPlayer: 'Only the lobby leader can end submission stage',
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
  let source = new URL(randomPage.content_urls.desktop.page);
  let destination = new URL(
    `https://${config.wikipediaHost}/wiki/Shia_LaBeouf` // Actual Cannibal
  );
  const submissions = lobby.players
    .map((player) => player.submission)
    .filter((submission) => (submission ? true : false)) as URL[];
  const distinctSubmissions = [...new Set(submissions)];
  if (distinctSubmissions.length > 0) {
    destination =
      distinctSubmissions[
        Math.floor(Math.random() * distinctSubmissions.length)
      ];
  }
  // If there's more than one unique submission, we can pick the source from the submissions as well
  if (distinctSubmissions.length >= 2) {
    const remainingSubmissions = distinctSubmissions.filter(
      (submission) => submission !== destination
    );
    source =
      remainingSubmissions[
        Math.floor(Math.random() * remainingSubmissions.length)
      ];
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
  const parentNodes = player.tree
    ? findNodesInTree({ pathname: parent, node: player.tree, foundNodes: [] })
    : [];
  if (!parentNodes.length) {
    handlePlayerError({
      eventDescription: 'Could not update player navigation tree',
      reasonShownToPlayer:
        'Could not find parent node in the existing navigation tree',
      client,
    });
    return false;
  }

  //Update navigation tree for each parent node found
  let markAsVisited = false;
  const addedNodes: Node[] = [];
  for (const parentNode of parentNodes) {
    let childExists = false;
    for (const node of parentNode.children) {
      if (node.article.pathname === visited) {
        // Node already exists, we don't need to add it to the tree
        childExists = true;
      }
    }
    if (!childExists) {
      const node = {
        article: new URL(`https://${config.wikipediaHost}${visited}`),
        when: new Date(),
        children: [],
      };
      parentNode.children.push(node);
      addedNodes.push(node);
      markAsVisited = true;

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
          player.shortestClickCount.count === -1 ||
          clickCount < player.shortestClickCount.count
        ) {
          const when = new Date();
          player.shortestClickCount.count = clickCount;
          player.shortestClickCount.when = when;
          broadcastToLobbyPlayers({
            message: `NEW_CLICK_COUNT ${player.alias} ${clickCount} ${when.getTime()}`,
            code: lobby.code,
          });
        }
      }
    }
  }

  if (markAsVisited) {
    player.visitCount = player.visitCount + 1;
    broadcastToLobbyPlayers({
      message: `VISIT_COUNT ${player.alias} ${player.visitCount}`,
      code: lobby.code,
    });
  }

  // If the page has a redirect, we want to update the node with the canonical article link instead
  if (addedNodes.length) {
    fetch(addedNodes[0].article.href)
      .then((response) => response.text())
      .then((html) => {
        const matches = html.match(/rel="canonical" href="(.*)"/);
        if (
          matches?.length &&
          matches.length >= 2 &&
          matches[1].startsWith(`https://${config.wikipediaHost}`)
        ) {
          for (const node of addedNodes) {
            node.article = new URL(matches[1]);
          }
        }
      });
  }
};

interface FindNodeInTreeRequest {
  pathname: string;
  node: Node;
  foundNodes: Node[];
}

const findNodesInTree = ({
  pathname,
  node,
  foundNodes,
}: FindNodeInTreeRequest): Node[] => {
  if (node.article.pathname === pathname) {
    return [...foundNodes, node];
  }
  if (node.children.length) {
    let foundNodesCumulative = [...foundNodes];
    for (const childNode of node.children) {
      const foundNodesFromChildren = findNodesInTree({
        pathname,
        node: childNode,
        foundNodes: foundNodesCumulative,
      });
      if (foundNodesFromChildren.length > foundNodesCumulative.length) {
        foundNodesCumulative = [...foundNodesFromChildren];
      }
    }
    return foundNodesCumulative;
  }
  return foundNodes;
};
