import './PhraseInput.css';
import { useTranslation } from '../../i18n/TranslationProvider';

export default function PhraseInput({ value, onChange, onSubmit, onCancel, disabled }) {
  const { t } = useTranslation();
  return (
    <div className="phrase-input-container">
      <input
        type="text"
        className="phrase-input"
        placeholder={t('phrase.placeholder')}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      />
      <div className="phrase-input-buttons">
        <button
          className="phrase-input-button confirm-btn"
          onClick={onSubmit}
          disabled={!value || disabled}
        >
          {t('phrase.confirm')}
        </button>
        <button
          className="phrase-input-button cancel-btn"
          onClick={onCancel}
          disabled={disabled}
        >
          {t('phrase.cancel')}
        </button>
      </div>
    </div>
  );
}
