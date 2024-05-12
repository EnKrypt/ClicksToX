import { useState } from 'react';
import { State } from '../types';
import Error from './Error';
import { getArticleSlug } from '../utils';

interface PlayingScreenProps {
  finished: boolean;
  resetLobby: () => void;
  gameState: State;
  error: { show: boolean; message: string };
  hideError: () => void;
}

const PlayingScreen = ({
  finished,
  resetLobby,
  gameState,
  error,
  hideError,
}: PlayingScreenProps) => {
  const timerMinutes = Math.trunc(gameState.timer / 60);
  const timerSeconds = gameState.timer % 60;
  const source = gameState.source ? new URL(gameState.source) : undefined;
  const destination = gameState.destination
    ? new URL(gameState.destination)
    : undefined;
  const currentPlayer = gameState.players[0].isSelf
    ? gameState.players[0]
    : undefined;
  const pathFound = currentPlayer?.shortestClickCount.count !== -1;
  /* We decide that the current player has found the shortest path in the game, if
   * 1. The current player has already found a complete path from source to destination
   * AND
   * 2. For every player in the lobby, if the player
   *    2.1 Is the same as the current player
   *    OR
   *    2.2 Has not found a complete path from source to destination
   *    OR
   *    2.3 Has a bigger shortest click count than current player
   *    OR
   *      2.3.1 Has the same shortest click count as current player
   *      AND
   *      2.3.2 Reached the shortest click count after the current player
   */
  const shortestPathFound =
    currentPlayer && pathFound
      ? gameState.players.every(
          (player) =>
            currentPlayer.alias === player.alias ||
            player.shortestClickCount.count === -1 ||
            currentPlayer.shortestClickCount.count <
              player.shortestClickCount.count ||
            (currentPlayer.shortestClickCount.count ===
              player.shortestClickCount.count &&
              currentPlayer.shortestClickCount.when <
                player.shortestClickCount.when)
        )
      : false;

  // Calculate winner if the game is over
  const winner = {
    count: Infinity,
    when: new Date(),
    alias: '',
  };
  if (finished) {
    for (const player of gameState.players) {
      if (
        player.shortestClickCount.count !== -1 &&
        (player.shortestClickCount.count < winner.count ||
          (player.shortestClickCount.count === winner.count &&
            player.shortestClickCount.when < winner.when))
      ) {
        winner.alias = player.alias;
        winner.count = player.shortestClickCount.count;
        winner.when = player.shortestClickCount.when;
      }
    }
  }

  const [sourceCopied, setSourceCopied] = useState<boolean>(false);
  const [destinationCopied, setDestinationCopied] = useState<boolean>(false);

  return (
    <div className="screen">
      <div
        className={[
          'lobby-info',
          pathFound ? 'path-found' : '',
          shortestPathFound ? 'shortest-path-found' : '',
          finished ? 'finished' : '',
        ]
          .join(' ')
          .trim()}
      >
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
          <div className="row">
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
              <div className="player-info">
                <div className="status">
                  {winner.alias === player.alias
                    ? '🏆'
                    : player.shortestClickCount.count !== -1
                      ? '🏁'
                      : ''}
                </div>
                <div className="visit-count">
                  {player.visitCount} articles visited
                </div>
              </div>
            </div>
          ))}
        </div>
        {finished ? (
          currentPlayer?.isCreator ? (
            <button
              onClick={() => {
                resetLobby();
              }}
            >
              Reset Lobby
            </button>
          ) : (
            <div className="no-action-message">
              Waiting for lobby leader to reset lobby
            </div>
          )
        ) : null}
      </div>
      <Error error={error} hideError={hideError} />
    </div>
  );
};

export default PlayingScreen;
