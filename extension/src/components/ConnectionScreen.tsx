import { useState } from 'react';
import Error from './Error';

interface ConnectionScreenProps {
  createLobby: (url: string, alias: string, roundTimeLimit: string) => void;
  joinLobby: (url: string, alias: string, lobbyCode: string) => void;
  error: { show: boolean; message: string };
  hideError: () => void;
}

const ConnectionScreen = ({
  createLobby,
  joinLobby,
  error,
  hideError,
}: ConnectionScreenProps) => {
  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'create'
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [roundTimeLimit, setRoundTimeLimit] = useState('300');

  return (
    <div className="screen">
      <div className="tab-menu">
        <div
          onClick={() => setActiveTab('join')}
          className={activeTab === 'join' ? 'active' : ''}
        >
          Join Lobby
        </div>
        <div
          onClick={() => setActiveTab('create')}
          className={activeTab === 'create' ? 'active' : ''}
        >
          Create Lobby
        </div>
      </div>
      <div className="tab-content">
        {activeTab === 'join' ? (
          <div>
            <div className="field">
              <div className="field-name">URL</div>
              <input
                type="text"
                placeholder="wss://example.com:1234"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="field">
              <div className="field-name">Alias</div>
              <input
                type="text"
                placeholder="Player"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
              />
            </div>
            <div className="field">
              <div className="field-name">Lobby Code</div>
              <input
                type="text"
                placeholder="ABCD"
                value={lobbyCode}
                onChange={(e) => setLobbyCode(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                joinLobby(url, alias, lobbyCode);
              }}
            >
              Join
            </button>
          </div>
        ) : (
          <div>
            <div className="field">
              <div className="field-name">URL</div>
              <input
                type="text"
                placeholder="wss://example.com:1234"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="field">
              <div className="field-name">Alias</div>
              <input
                type="text"
                placeholder="Player"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
              />
            </div>
            <div className="field">
              <div className="field-name">Time Limit (seconds)</div>
              <input
                type="text"
                placeholder="Round Time Limit (seconds)"
                value={roundTimeLimit}
                onChange={(e) => setRoundTimeLimit(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                createLobby(url, alias, roundTimeLimit);
              }}
            >
              Create
            </button>
          </div>
        )}
      </div>
      <Error error={error} hideError={hideError} />
    </div>
  );
};

export default ConnectionScreen;
