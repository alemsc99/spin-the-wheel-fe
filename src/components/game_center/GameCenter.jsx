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
    </div>
  );
}
