import { type State, initialGameState, STAGE } from './types';

let connection: WebSocket | undefined;
let gameState: State = JSON.parse(JSON.stringify(initialGameState));
let app: chrome.runtime.Port | undefined;

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
        // Populate the player list in the game state
        gameState.players = playerNames
          .map((name) => ({
            isSelf: name[0] === '~' || name[0] === '@',
            isCreator: name[0] === '~' || name[0] === '!',
            alias:
              name[0] === '~' || name[0] === '!' || name[0] === '@'
                ? name.substring(1)
                : name,
            submission: undefined,
            tree: undefined,
            visitCount: 0,
            shortestClickCount: { count: -1, when: new Date() },
          }))
          // Bring the current player to the top of the player list
          .sort((playerA) => {
            if (playerA.isSelf) {
              return -1;
            }
            return 0;
          });
        app?.postMessage({ state: gameState });
        break;
      }
      case 'SUBMIT': {
        const player = gameState.players.find(
          (player) => player.alias === commands[1]
        );
        if (player) {
          player.submission = commands[2];
        }
        app?.postMessage({ state: gameState });
        break;
      }
      case 'PLAYING': {
        gameState.stage = STAGE.PLAYING;
        gameState.source = commands[1];
        gameState.destination = commands[2];
        app?.postMessage({ state: gameState });
        chrome.tabs.create({ url: commands[1] });
        break;
      }
      case 'TIMER': {
        gameState.timer = Number(commands[1] as string);
        app?.postMessage({ state: gameState });
        break;
      }
      case 'VISIT_COUNT': {
        for (const player of gameState.players) {
          if (player.alias === commands[1]) {
            player.visitCount = Number(commands[2] as string);
            break;
          }
        }
        app?.postMessage({ state: gameState });
        break;
      }
      case 'NEW_CLICK_COUNT': {
        for (const player of gameState.players) {
          if (player.alias === commands[1]) {
            player.shortestClickCount = {
              count: Number(commands[2] as string),
              when: new Date(Number(commands[3] as string)),
            };
            break;
          }
        }
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

chrome.runtime.onConnect.addListener((port) => {
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
            'ClicksToX: Connection to game server not yet established'
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
