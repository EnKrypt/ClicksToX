import WebSocketClient, { WebSocket } from 'ws';
import { type State, initialGameState } from './types';

let connection: WebSocket | undefined;
let gameState: State = JSON.parse(JSON.stringify(initialGameState));
let app: browser.runtime.Port | undefined;

const resetGameState = () => {
  gameState = JSON.parse(JSON.stringify(initialGameState));
  app?.postMessage({ state: gameState });
};

const connect = (url: string, callback: () => void) => {
  connection = new WebSocketClient(url);

  connection.on('error', () => {
    resetGameState();
  });

  connection.on('close', () => {
    resetGameState();
  });

  connection.on('open', () => {
    callback();
  });

  connection.on('message', (data: string) => {
    console.debug(`ClicksToX: Received over ws: ${data}`);
    const commands = data.split(' ');
    switch (commands[0]) {
      case 'ERROR': {
        commands.shift();
        app?.postMessage({ error: commands.join(' ') });
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
