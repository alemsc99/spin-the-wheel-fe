import { useTranslation } from "../../i18n/TranslationProvider";

// SkipOverlay component to display messages related to skipping turn
export default function SkipOverlay({ show, messageKey }: { show: boolean, messageKey: string}) {
  const { t } = useTranslation();
  if (!show) return null;
  const message = t(messageKey || '');
  return (
    <div className='overlay skip-overlay'>
      <div className='overlay-box'>
        <span role="img" aria-label="skip" style={{ fontSize: 64, marginBottom: 8 }}>⏭️</span>
        <h2 className="overlay-skip-title">{message}</h2>
      </div>
    </div>
  );
}