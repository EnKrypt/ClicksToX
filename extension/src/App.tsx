import { useEffect, useState } from 'react';
import ConnectionScreen from './components/ConnectionScreen';
import { STAGE, initialGameState, type State } from './types';

const App = () => {
  const [gameState, setGameState] = useState<State>(
    JSON.parse(JSON.stringify(initialGameState))
  );
  const [port, setPort] = useState<browser.runtime.Port | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  const createLobby = (url: string, alias: string, roundTimeLimit: string) => {
    port?.postMessage({ url, message: `CREATE ${alias} ${roundTimeLimit}` });
  };

  const joinLobby = (url: string, alias: string, lobbyCode: string) => {
    port?.postMessage({ url, message: `JOIN ${alias} ${lobbyCode}` });
  };

  useEffect(() => {
    const port = browser.runtime.connect({ name: 'clicks-to-x' });
    setPort(port);
    setLoading(false);
    port.onMessage.addListener((message) => {
      if ('state' in message) {
        setGameState(message.state as State);
      }
    });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  switch (gameState.stage) {
    case STAGE.DISCONNECTED:
      return (
        <ConnectionScreen createLobby={createLobby} joinLobby={joinLobby} />
      );
    default:
      break;
  }
};

export default App;
