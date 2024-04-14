import { WebSocket } from 'ws';
import Winston from 'winston';
import config from './config.js';

export const logger = Winston.createLogger({
  level: config.logLevel,
  format: Winston.format.simple(),
  transports: [new Winston.transports.Console()],
});

interface HandlePlayerErrorRequest {
  eventDescription: string;
  reasonShownToPlayer: string;
  client: WebSocket;
}

export const handlePlayerError = ({
  eventDescription,
  reasonShownToPlayer,
  client,
}: HandlePlayerErrorRequest) => {
  logger.warn(`${eventDescription}: ${reasonShownToPlayer}`);
  client.send(`ERROR ${reasonShownToPlayer}`);
};
