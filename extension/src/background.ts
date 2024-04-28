import { initialGameState } from './types';

const gameState = JSON.parse(JSON.stringify(initialGameState));

const sendCommand = (command: string) => {
  console.debug(`Sending over ws: ${command}`);
};

interface Message {
  command: string;
}

browser.runtime.onConnect.addListener((port) => {
  if (port.name === 'clicks-to-x') {
    port.postMessage({ state: gameState });
    port.onMessage.addListener((response: object) => {
      if ('command' in response) {
        sendCommand((response as Message).command);
      } else {
        console.error('Received message does not contain `command` property');
      }
    });
  }
});
