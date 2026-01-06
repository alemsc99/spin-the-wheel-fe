import GuessPhraseOverlay from '../overlays/GuessPhraseOverlay.jsx';
import './GameActions.css';
import { useTranslation } from '../../i18n/TranslationProvider';

export default function GameActions({
  showPhraseInput,
  victory,
  score,
  canGuess,
  guessInput,
  onShowPhraseInput,
  onBuyVowel,
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

        {/* Button to buy a vowel */}
        <button
          className="action-button buy-vowel-btn"
          onClick={onBuyVowel}
          disabled={victory || score < 500 || canGuess}
        >
          <span role="img" aria-label="vowel" className="action-icon">🅰️</span>
          <span className="btn-text">{t('actions.buyVowel')}</span> {/* Testo avvolto */}
          <span className="buy-vowel-price">500🪙</span>
        </button>
        {/* Button to show rules */}
        <button
          className="action-button show-rules-btn"
          onClick={onShowRules}
          disabled={victory}
        >
          <span role="img" aria-label="rules" className="action-icon">📜</span>
          <span className="btn-text">{t('start.rules')}</span> {/* Testo avvolto */}
        </button>
        {/* Button to start a new game */}
        <button
          className="action-button new-game-btn"
          onClick={onNewGame}
          disabled={victory}
        >
          <span role="img" aria-label="sparkles" className="action-icon">✨</span>
          <span className="btn-text">{t('game.newGame')}</span> {/* Testo avvolto */}
        </button>
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
