import Wheel from '../wheel/Wheel.jsx';
import './GameCenter.css';
import { useTranslation } from '../../i18n/TranslationProvider';

export default function GameCenter({
  playerName,
  score,
  lastSpin,
  scoreIncrement,
  showScoreAnim,
  scoreDecrement,
  showScoreDecAnim,
  isSpinning,
  canGuess,
  numPlayers,
  onSpin,
  onSpinEnd,
  onNewGame,
  onWheelClick
}) {
  const { t } = useTranslation();
  return (
    <div className="game-center-container">
      {/* Wheel */}
      <div className="wheel-container">
        <div className="wheel-wrapper">
          <div className="wheel-position">
            <Wheel
              onSpin={onSpin}
              lastSpin={lastSpin}
              onSpinEnd={onSpinEnd}
              disabled={isSpinning || canGuess}
              numPlayers={numPlayers}
            />
            {(isSpinning || canGuess) && (
              <div className="wheel-overlay" onClick={onWheelClick} />
            )}
          </div>
        </div>
      </div>
      
      {/* Score box */}
      <div className="wheel-info-bar">
        <div className="wheel-info-row">
          <div className="wheel-info-item">
            <span className="wheel-info-label">{t('players.title').replace(/s?$/,'') + ':'}</span>
            <span
              className="wheel-info-value"
              title={playerName}
            >
              {playerName || '—'}
            </span>
          </div>
          <div className="wheel-info-item score-container">
            <span className="wheel-info-label">{t('score.label')}</span>
            <span className="wheel-info-value score-big">{score} €</span>
            {showScoreAnim && (
              <span className="score-increment-anim">+{scoreIncrement} €</span>
            )}
            {showScoreDecAnim && (
              <span className="score-decrement-anim">-{scoreDecrement} €</span>
            )}
          </div>
        </div>
        <button className="new-game-btn" onClick={onNewGame}>
          <span role="img" aria-label="sparkles" className="new-game-icon">✨</span>
          {t('game.newGame')}
        </button>
      </div>
    </div>
  );
}
