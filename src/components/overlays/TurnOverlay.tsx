import { useTranslation } from "../../i18n/TranslationProvider";

// TurnOverlay component to display messages during turns
export default function TurnOverlay({ show, playerName, messageKey, isError }: { show: boolean, playerName: string, messageKey: string, isError?: boolean }) {
  const { t } = useTranslation();
  if (!show) return null;
  const message = t(messageKey || '');
  return (
    <div className={`overlay ${isError ? 'defeat-overlay' : 'victory-overlay'}`}>
      <div className={`overlay-box ${isError ? 'defeat-box' : 'victory-box'}`}>
        <span role="img" aria-label={isError ? 'cross' : 'star'} style={{ fontSize: 64, marginBottom: 8 }}>{isError ? '❌' : '⭐'}</span>
        <h2 className={`overlay-title ${isError ? 'defeat-title' : 'victory-title'}`}>{message}</h2>
        {playerName && (
          <p className="overlay-text">
            <span style={{ fontWeight: 700, color: '#d84315', fontSize: 28 }}></span>
          </p>
        )}
      </div>
    </div>
  );
}