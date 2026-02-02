import { useTranslation } from "../../i18n/TranslationProvider";

// DoubleOverlay component to display messages related to double powerup
export default function DoubleOverlay({ show, messageKey }: { show: boolean, messageKey: string}) {
  const { t } = useTranslation();
  if (!show) return null;
  const message = t(messageKey || '');
  return (
    <div className='overlay double-overlay'>
      <div className='overlay-box'>
        <span role="img" aria-label="double" style={{ fontSize: 64, marginBottom: 8 }}>💰</span>
        <h2 className="overlay-double-title">{message}</h2>
      </div>
    </div>
  );
}