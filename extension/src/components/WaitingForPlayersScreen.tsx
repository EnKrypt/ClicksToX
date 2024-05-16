import { useState } from 'react';
import { State } from '../types';
import Error from './Error';
import { getArticleSlug } from '../utils';

interface WaitingForPlayersScreenProps {
  gameState: State;
  submitDestination: (submission: string) => void;
  endSubmission: () => void;
  error: { show: boolean; message: string };
  hideError: () => void;
}

const WaitingForPlayersScreen = ({
  gameState,
  submitDestination,
  endSubmission,
  error,
  hideError,
}: WaitingForPlayersScreenProps) => {
  const timerMinutes = Math.trunc(gameState.timer / 60);
  const timerSeconds = gameState.timer % 60;
  const currentPlayer = gameState.players[0].isSelf
    ? gameState.players[0]
    : undefined;

  const [copied, setCopied] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
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
          {gameState.players.map((player, index) => (
            <div
              className={index % 2 === 0 ? 'player even' : 'player'}
              key={player.alias}
            >
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
                        ? getArticleSlug(new URL(player.submission))
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
                      setSubmitted(true);
                      setTimeout(() => {
                        setSubmitted(false);
                      }, 1000);
                    }}
                  >
                    {submitted ? '✔️' : 'Submit'}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {currentPlayer?.isCreator ? (
          <button
            onClick={() => {
              endSubmission();
            }}
          >
            End Submission Phase
          </button>
        ) : (
          <div className="no-action-message">
            Waiting for lobby leader to end submission phase
          </div>
        )}
      </div>
      <Error error={error} hideError={hideError} />
    </div>
  );
};

export default WaitingForPlayersScreen;
