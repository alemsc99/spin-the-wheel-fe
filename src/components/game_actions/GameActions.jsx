import PhraseInput from '../phrase_input/PhraseInput.jsx';
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
  onGuessInputChange,
  onGuessPhrase,
  onHidePhraseInput
}) {
  const { t } = useTranslation();
  return (
    <div className="game-actions-container">
      {!showPhraseInput && (
        <>
          {/* Button to guess the phrase */}
          <button
            className="action-button guess-phrase-btn"
            onClick={onShowPhraseInput}
            disabled={victory}
          >
            <span role="img" aria-label="lightbulb" className="action-icon">💡</span>
            {t('actions.guessPhrase')}
          </button>

          {/* Button to buy a vowel */}
          <button
            className="action-button buy-vowel-btn"
            onClick={onBuyVowel}
            disabled={victory || score < 500 || canGuess}
          >
            <span role="img" aria-label="vowel" className="action-icon">🅰️</span>
            {t('actions.buyVowel')}
          </button>
        </>
      )}

      {showPhraseInput && (
        <PhraseInput
          value={guessInput}
          onChange={onGuessInputChange}
          onSubmit={onGuessPhrase}
          onCancel={onHidePhraseInput}
          disabled={victory}
        />
      )}
    </div>
  );
}
