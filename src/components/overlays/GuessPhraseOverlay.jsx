import './Overlays.css';
import PhraseInput from '../phrase_input/PhraseInput.jsx';
import { useTranslation } from '../../i18n/TranslationProvider';

export default function GuessPhraseOverlay({ show, guessInput, onGuessInputChange, onGuessPhrase, onHidePhraseInput, victory }) {
  const { t } = useTranslation();
  if (!show) return null;

  return (
    <div className="overlay guess-phrase-overlay">
      <div className="overlay-box guess-phrase-box">
        <span role="img" aria-label="bulb" className="overlay-trophy-icon">💡</span>
        <h2 className="overlay-title guess-phrase-title">{t('actions.guessPhrase')}</h2>
        
        <PhraseInput
          value={guessInput}
          onChange={onGuessInputChange}
          onSubmit={onGuessPhrase}
          onCancel={onHidePhraseInput}
          disabled={victory}
        />
      </div>
    </div>
  );
}
