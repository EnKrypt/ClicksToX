import { useEffect, useState } from 'react';
import ConnectionScreen from './components/ConnectionScreen';
import LoadingScreen from './components/LoadingScreen';
import PlayingScreen from './components/PlayingScreen';
import WaitingForPlayersScreen from './components/WaitingForPlayersScreen';
import { STAGE, initialGameState, type State } from './types';
import { isWikipediaArticle } from './utils';

const App = () => {
  /* The `gameState` state variable is very important here.
   * We are going to use the game state itself as the main way
   * to receive communications from the background script and
   * by extension, the game server.
   * This app wil react differently according to the state of
   * the game, and that will be enough to play the entire game.
   *
   * Now you know why it's called 'React'. It was built around
   * this principle of state handling.
   */
  const [gameState, setGameState] = useState<State>(
    JSON.parse(JSON.stringify(initialGameState))
  );
  const [port, setPort] = useState<chrome.runtime.Port | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: '' });

  const showError = (message: string) => {
    setError({ show: true, message });
  };

  const hideError = () => {
    setError({ show: false, message: '' });
  };

  const createLobby = (url: string, alias: string, roundTimeLimit: string) => {
    if (!url || !alias || !roundTimeLimit) {
      showError('Field cannot be blank');
      return;
    }
    port?.postMessage({ url, command: `CREATE ${alias} ${roundTimeLimit}` });
  };

  const joinLobby = (url: string, alias: string, lobbyCode: string) => {
    if (!url || !alias || !lobbyCode) {
      showError('Field cannot be blank');
      return;
    }
    port?.postMessage({ url, command: `JOIN ${alias} ${lobbyCode}` });
  };

  const submitDestination = (submission: string) => {
    if (!submission) {
      showError('Field cannot be blank');
      return;
    }
    port?.postMessage({ command: `SUBMIT ${submission}` });
  };

  const endSubmission = () => {
    port?.postMessage({ command: `END_SUBMISSION` });
  };

  const resetLobby = () => {
    port?.postMessage({ command: `RESET` });
  };

  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'clicks-to-x' });
    setPort(port);
    setLoading(false);
    port.onMessage.addListener((message) => {
      if ('error' in message) {
        showError(message.error as string);
      } else if ('state' in message) {
        setGameState(message.state as State);
      }
    });

    document.addEventListener('mousedown', (event) => {
      const element = event.target as HTMLAnchorElement;
      if (element.tagName === 'A') {
        const fromArticle = new URL(window.location.href);
        const toArticle = new URL(element.href);
        if (isWikipediaArticle(toArticle.href)) {
          port?.postMessage({
            command: `VISIT ${fromArticle.pathname} ${toArticle.pathname}`,
          });
        }
      }
    });
  }, []);

  if (loading) {
    return <LoadingScreen error={error} hideError={hideError} />;
  }

  switch (gameState.stage) {
    case STAGE.DISCONNECTED:
      return (
        <ConnectionScreen
          createLobby={createLobby}
          joinLobby={joinLobby}
          error={error}
          hideError={hideError}
        />
      );
    case STAGE.WAITING_FOR_PLAYERS_TO_JOIN:
      return (
        <WaitingForPlayersScreen
          gameState={gameState}
          submitDestination={submitDestination}
          endSubmission={endSubmission}
          error={error}
          hideError={hideError}
        />
      );
    case STAGE.PLAYING:
      return (
        <PlayingScreen
          finished={false}
          resetLobby={resetLobby}
          gameState={gameState}
          error={error}
          hideError={hideError}
        />
      );
    case STAGE.FINISHED:
      return (
        <PlayingScreen
          finished={true}
          resetLobby={resetLobby}
          gameState={gameState}
          error={error}
          hideError={hideError}
        />
      );
    default:
      break;
  }
};

export default App;
