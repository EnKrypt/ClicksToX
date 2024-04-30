import { type State, initialGameState, STAGE } from './types';

let connection: WebSocket | undefined;
let gameState: State = JSON.parse(JSON.stringify(initialGameState));
let app: browser.runtime.Port | undefined;

const resetGameState = () => {
  gameState = JSON.parse(JSON.stringify(initialGameState));
  app?.postMessage({ state: gameState });
};

const connect = (url: string, callback: () => void) => {
  connection = new WebSocket(url);

  connection.addEventListener('error', () => {
    resetGameState();
    app?.postMessage({
      error: 'The connection to the server errored out',
    });
  });

  connection.addEventListener('close', () => {
    resetGameState();
    app?.postMessage({
      error: 'The connection to the server was closed',
    });
  });

  connection.addEventListener('open', () => {
    gameState.connection = connection;
    callback();
  });

  connection.addEventListener('message', (event) => {
    console.debug(`ClicksToX: Received over ws: ${event.data}`);
    const commands = event.data.split(' ');
    switch (commands[0]) {
      case 'ERROR': {
        commands.shift();
        app?.postMessage({ error: commands.join(' ') });
        break;
      }
      case 'PLAYERS': {
        gameState.stage = STAGE.WAITING_FOR_PLAYERS_TO_JOIN;
        gameState.timer = Number(commands[2] as string);
        gameState.code = commands[1] as string;
        const playerNames = (commands[3] as string).split(',');
        gameState.players = playerNames.map((name) => ({
          isSelf: name[0] === '~' || name[0] === '@',
          isCreator: name[0] === '~' || name[0] === '!',
          alias:
            name[0] === '~' || name[0] === '!' || name[0] === '@'
              ? name.substring(1)
              : name,
          submission: undefined,
          tree: undefined,
        }));
        app?.postMessage({ state: gameState });
        break;
      }
      default:
        break;
    }
  });
};

const sendCommand = (command: string) => {
  console.debug(`ClicksToX: Sending over ws: ${command}`);
  connection?.send(command);
};

interface Message {
  command: string;
}

browser.runtime.onConnect.addListener((port) => {
  app = port;
  if (app.name === 'clicks-to-x') {
    app.postMessage({ state: gameState });
    app.onMessage.addListener((response: object) => {
      if ('url' in response && 'command' in response) {
        connect(response.url as string, () => {
          sendCommand((response as Message).command);
        });
      } else if ('command' in response) {
        if (connection) {
          sendCommand((response as Message).command);
        } else {
          console.error(
            'ClicksToX: Received message does not contain `command` property'
          );
        }
      } else {
        console.error(
          'ClicksToX: Received message does not contain `command` property'
        );
      }
    });
  }
});
