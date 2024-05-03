import { useState } from 'react';
import { State } from '../types';
import Error from './Error';

interface WaitingForPlayersScreenProps {
  gameState: State;
  submitDestination: (submission: string) => void;
  error: { show: boolean; message: string };
  hideError: () => void;
}

const WaitingForPlayersScreen = ({
  gameState,
  submitDestination,
  error,
  hideError,
}: WaitingForPlayersScreenProps) => {
  const timerMinutes = Math.trunc(gameState.timer / 60);
  const timerSeconds = gameState.timer % 60;
  const currentPlayer = gameState.players[0].isSelf
    ? gameState.players[0]
    : undefined;

  const [copied, setCopied] = useState<boolean>(false);
  const [submission, setSubmission] = useState<string>('');

  return (
    <div className="screen">
      <div className="lobby-info">
        <div className="timer">
          {timerMinutes}:{timerSeconds < 10 ? '0' : ''}
          {timerSeconds}
        </div>
        <div className="lobby-code">
          Lobby code: <span className="code">{gameState.code}</span>{' '}
          <span
            className="clickable"
            onClick={() => {
              navigator.clipboard.writeText(gameState.code);
              setCopied(true);
              setTimeout(() => {
                setCopied(false);
              }, 1000);
            }}
          >
            {copied ? '✔️' : '📋'}
          </span>
        </div>
        <div className="players">
          {gameState.players.map((player) => (
            <div className="player" key={player.alias}>
              <div className="is-creator">{player.isCreator ? '👑' : ''}</div>
              <div className="alias">{player.alias}</div>
              <div className="submission">
                <input
                  type="text"
                  placeholder="No submission yet"
                  value={
                    player.isSelf
                      ? submission
                      : player.submission
                        ? new URL(player.submission).pathname
                        : ''
                  }
                  disabled={player.isSelf ? false : true}
                  onChange={(e) => {
                    if (player.isSelf) {
                      setSubmission(e.target.value);
                    }
                  }}
                />
                {player.isSelf ? (
                  <button
                    onClick={() => {
                      submitDestination(submission);
                    }}
                  >
                    Submit
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {currentPlayer?.isCreator ? (
          <button onClick={() => {}}>End Submission Phase</button>
        ) : (
          <div className="no-action-message">
            Waiting for lobby creator to end submission phase
          </div>
        )}
      </div>
      <Error error={error} hideError={hideError} />
    </div>
  );
};

export default WaitingForPlayersScreen;
