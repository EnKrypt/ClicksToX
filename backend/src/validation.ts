import { type WebSocket } from 'ws';
import { handlePlayerError } from './logging.js';

interface ValidationRequest {
  client: WebSocket;
  commands: string[];
}

export const validateCreateCommand = ({
  client,
  commands,
}: ValidationRequest): boolean => {
  if (commands.length !== 3) {
    handlePlayerError({
      eventDescription: 'Could not create a new lobby',
      reasonShownToPlayer:
        'Invalid command format; updating the extension may be required',
      client,
    });
    return false;
  }
  if (!/^[0-9A-Za-z]*$/.test(commands[1])) {
    handlePlayerError({
      eventDescription: 'Could not create a new lobby',
      reasonShownToPlayer: 'Alias can only contain alphanumeric characters',
      client,
    });
    return false;
  }
  if (commands[1].length < 1 || commands[1].length > 12) {
    handlePlayerError({
      eventDescription: 'Could not create a new lobby',
      reasonShownToPlayer: 'Alias must be within 1 to 12 characters in length',
      client,
    });
    return false;
  }
  const roundTimeLimit = parseInt(commands[2], 10);
  if (
    Number.isNaN(roundTimeLimit) ||
    roundTimeLimit < 5 ||
    roundTimeLimit > 1800
  ) {
    handlePlayerError({
      eventDescription: 'Could not create a new lobby',
      reasonShownToPlayer:
        'Round time limit must be a number between 5 and 1800, i.e. within 5 seconds to 30 minutes',
      client,
    });
    return false;
  }
  return true;
};

export const validateJoinCommand = ({
  client,
  commands,
}: ValidationRequest): boolean => {
  if (commands.length !== 3) {
    handlePlayerError({
      eventDescription: 'Could not join lobby',
      reasonShownToPlayer:
        'Invalid command format; updating the extension may be required',
      client,
    });
    return false;
  }
  if (!/^[0-9A-Za-z]*$/.test(commands[1])) {
    handlePlayerError({
      eventDescription: 'Could not join lobby',
      reasonShownToPlayer: 'Alias can only contain alphanumeric characters',
      client,
    });
    return false;
  }
  if (commands[1].length < 1 || commands[1].length > 12) {
    handlePlayerError({
      eventDescription: 'Could not join lobby',
      reasonShownToPlayer: 'Alias must be within 1 to 12 characters in length',
      client,
    });
    return false;
  }
  if (!/^[0-9A-Za-z]*$/.test(commands[2]) || commands[2].length !== 4) {
    handlePlayerError({
      eventDescription: 'Could not join lobby',
      reasonShownToPlayer: 'Lobby code must be 4 digits and alphanumeric',
      client,
    });
    return false;
  }
  return true;
};
