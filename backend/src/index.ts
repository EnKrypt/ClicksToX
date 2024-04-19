import { WebSocketServer, type WebSocket } from 'ws';
import config from './config.js';
import { createLobby } from './lobby.js';
import { logger } from './logging.js';
import { submitDestinationPageCandidate } from './pages.js';
import { addPlayerToLobby, removePlayer } from './player.js';
import { type Lobby } from './types.js';
import {
  validateCreateCommand,
  validateJoinCommand,
  validateSubmitCommand,
} from './validation.js';

const wss = new WebSocketServer({ port: config.port });

export const codeToLobbyMapping = new Map<string, Lobby>();
export const clientToLobbyMapping = new Map<WebSocket, Lobby>();

wss.on('connection', (client, request) => {
  client.on('error', (error) => {
    logger.warn(`Error with connection. ${error}`);
    removePlayer({ client, request });
  });

  client.on('close', (code, reason) => {
    logger.warn(`Client disconnected. Code: ${code}; Reason: ${reason}`);
    removePlayer({ client, request });
  });

  client.on('message', (data) => {
    const message = data.toString('utf8');
    logger.debug(`Received: ${message}`);
    const commands = message.split(' ');
    const command = commands[0];
    switch (command) {
      case 'CREATE': {
        if (!validateCreateCommand({ client, commands })) {
          return;
        }
        const code = createLobby({
          client,
          roundTimeLimit: Number(commands[2]),
        });
        if (code) {
          addPlayerToLobby({
            client,
            request,
            code,
            alias: commands[1],
            isCreator: true,
          });
        }
        break;
      }
      case 'JOIN': {
        if (!validateJoinCommand({ client, commands })) {
          return;
        }
        addPlayerToLobby({
          client,
          request,
          code: commands[2],
          alias: commands[1],
          isCreator: false,
        });
        break;
      }
      case 'SUBMIT': {
        if (!validateSubmitCommand({ client, commands })) {
          return;
        }
        submitDestinationPageCandidate({ client, submission: commands[1] });
        break;
      }
      default:
        return;
    }
  });
});

logger.info(`ClicksToX server is running on port ${config.port}`);
