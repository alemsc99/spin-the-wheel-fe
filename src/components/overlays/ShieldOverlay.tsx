import { useTranslation } from "../../i18n/TranslationProvider";

// ShieldOverlay component to display messages related to shields
export default function ShieldOverlay({ show, messageKey }: { show: boolean, messageKey: string}) {
  const { t } = useTranslation();
  if (!show) return null;
  const message = t(messageKey || '');
  return (
    <div className='overlay shield-overlay'>
      <div className='overlay-box'>
        <span role="img" aria-label="shield" style={{ fontSize: 64, marginBottom: 8 }}>🛡️</span>
        <h2 className="overlay-shield-title">{message}</h2>
      </div>
    </div>
  );
}