import { useState } from 'react';
import { State } from '../types';
import Error from './Error';
import { getArticleSlug } from '../utils';

interface PlayingScreenProps {
  gameState: State;
  error: { show: boolean; message: string };
  hideError: () => void;
}

const PlayingScreen = ({ gameState, error, hideError }: PlayingScreenProps) => {
  const timerMinutes = Math.trunc(gameState.timer / 60);
  const timerSeconds = gameState.timer % 60;
  const source = gameState.source ? new URL(gameState.source) : undefined;
  const destination = gameState.destination
    ? new URL(gameState.destination)
    : undefined;

  const [sourceCopied, setSourceCopied] = useState<boolean>(false);
  const [destinationCopied, setDestinationCopied] = useState<boolean>(false);

  return (
    <div className="screen">
      <div className="lobby-info">
        <div className="timer">
          {timerMinutes}:{timerSeconds < 10 ? '0' : ''}
          {timerSeconds}
        </div>
        <div className="links">
          <div className="row">
            <div className="label">Source: </div>
            <div className="link">{getArticleSlug(source)}</div>
            <div
              className="clickable"
              onClick={() => {
                navigator.clipboard.writeText(source?.href ?? '');
                setSourceCopied(true);
                setTimeout(() => {
                  setSourceCopied(false);
                }, 1000);
              }}
            >
              {sourceCopied ? '✔️' : '📋'}
            </div>
          </div>
          <div className="destination">
            <div className="label">Destination: </div>
            <div className="link">{getArticleSlug(destination)}</div>
            <div
              className="copy clickable"
              onClick={() => {
                navigator.clipboard.writeText(destination?.href ?? '');
                setDestinationCopied(true);
                setTimeout(() => {
                  setDestinationCopied(false);
                }, 1000);
              }}
            >
              {destinationCopied ? '✔️' : '📋'}
            </div>
          </div>
        </div>
        <div className="players">
          {gameState.players.map((player) => (
            <div className="player" key={player.alias}>
              <div className="is-creator">{player.isCreator ? '👑' : ''}</div>
              <div className="alias">{player.alias}</div>
              <div className="status"></div>
            </div>
          ))}
        </div>
      </div>
      <Error error={error} hideError={hideError} />
    </div>
  );
};

export default PlayingScreen;
