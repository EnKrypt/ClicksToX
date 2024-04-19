import { type WebSocket } from 'ws';
import config from './config.js';
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

export const validateSubmitCommand = ({
  client,
  commands,
}: ValidationRequest): boolean => {
  if (commands.length !== 2) {
    handlePlayerError({
      eventDescription: 'Could not submit destination page candidate',
      reasonShownToPlayer:
        'Invalid command format; updating the extension may be required',
      client,
    });
    return false;
  }
  if (commands[1].length > 128) {
    handlePlayerError({
      eventDescription: 'Could not submit destination page candidate',
      reasonShownToPlayer: 'Submission is greater than 128 characters',
      client,
    });
    return false;
  }
  try {
    const candidate = new URL(commands[1]);
    if (candidate.host !== config.wikipediaHost) {
      handlePlayerError({
        eventDescription: 'Could not submit destination page candidate',
        reasonShownToPlayer: `Host of the submitted URL is not '${config.wikipediaHost}'`,
        client,
      });
      return false;
    }
    if (!/^\/wiki\/[^/]+$/.test(candidate.pathname)) {
      handlePlayerError({
        eventDescription: 'Could not submit destination page candidate',
        reasonShownToPlayer:
          'Submission URL does not follow pattern for Wikipedia articles; trailing slashes may need to be removed',
        client,
      });
      return false;
    }
  } catch {
    handlePlayerError({
      eventDescription: 'Could not submit destination page candidate',
      reasonShownToPlayer: `'${commands[1]}' is not a valid URL`,
      client,
    });
    return false;
  }
  return true;
};
