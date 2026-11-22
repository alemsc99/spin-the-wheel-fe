import GuessPhraseOverlay from '../overlays/GuessPhraseOverlay.jsx';
import './GameActions.css';
import { useTranslation } from '../../i18n/TranslationProvider';

export default function GameActions({
  showPhraseInput,
  victory,
  guessInput,
  onShowPhraseInput,
  onShowRules,
  onNewGame,
  onGuessInputChange,
  onGuessPhrase,
  onHidePhraseInput
}) {
  const { t } = useTranslation();
  return (
    <div className="game-actions-container">
      <div className="actions-buttons-grid">
        {/* Button to guess the phrase */}
        <button
          className="action-button guess-phrase-btn"
          onClick={onShowPhraseInput}
          disabled={victory}
        >
          <span role="img" aria-label="lightbulb" className="action-icon">💡</span>
          <span className="btn-text">{t('actions.guessPhrase')}</span>
        </button>

        <div className="secondary-actions">
          {/* Button to show rules */}
          <button
            className="action-button show-rules-btn"
            onClick={onShowRules}
            disabled={victory}
          >
            <span role="img" aria-label="rules" className="action-icon">📜</span>
            <span className="btn-text">{t('start.rules')}</span>
          </button>
          {/* Button to start a new game */}
          <button
            className="action-button new-game-btn"
            onClick={onNewGame}
            disabled={victory}
          >
            <span role="img" aria-label="play" className="action-icon">▶️</span>
            <span className="btn-text">{t('game.newGame')}</span>
          </button>
        </div>
      </div>

      <GuessPhraseOverlay
        show={showPhraseInput}
        guessInput={guessInput}
        onGuessInputChange={onGuessInputChange}
        onGuessPhrase={onGuessPhrase}
        onHidePhraseInput={onHidePhraseInput}
        victory={victory}
      />
    </div>
  );
}
