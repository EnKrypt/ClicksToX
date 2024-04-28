import { useEffect, useState } from 'react';
import ConnectionScreen from './components/ConnectionScreen';
import { STAGE, initialGameState, type State } from './types';
import LoadingScreen from './components/LoadingScreen';

const App = () => {
  const [gameState, setGameState] = useState<State>(
    JSON.parse(JSON.stringify(initialGameState))
  );
  const [port, setPort] = useState<browser.runtime.Port | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: '' });

  const showError = (message: string) => {
    setError({ show: true, message });
  };

  const createLobby = (url: string, alias: string, roundTimeLimit: string) => {
    if (!url || !alias || !roundTimeLimit) {
      showError('Field cannot be blank');
    }
    port?.postMessage({ url, command: `CREATE ${alias} ${roundTimeLimit}` });
  };

  const joinLobby = (url: string, alias: string, lobbyCode: string) => {
    port?.postMessage({ url, command: `JOIN ${alias} ${lobbyCode}` });
  };

  useEffect(() => {
    const port = browser.runtime.connect({ name: 'clicks-to-x' });
    setPort(port);
    setLoading(false);
    port.onMessage.addListener((message) => {
      if ('error' in message) {
        showError(message.error as string);
      } else if ('state' in message) {
        setGameState(message.state as State);
      }
    });
  }, []);

  if (loading) {
    return <LoadingScreen error={error} />;
  }

  switch (gameState.stage) {
    case STAGE.DISCONNECTED:
      return (
        <ConnectionScreen
          createLobby={createLobby}
          joinLobby={joinLobby}
          error={error}
        />
      );
    default:
      break;
  }
};

export default App;
