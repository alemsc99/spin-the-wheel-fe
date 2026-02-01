import { useTranslation } from "../../i18n/TranslationProvider";

// ShieldOverlay component to display messages related to shields
export default function LoseItAllOverlay({ show, messageKey }: { show: boolean, messageKey: string}) {
  const { t } = useTranslation();
  if (!show) return null;
  const message = t(messageKey || '');
  return (
    <div className='overlay lose-it-all-overlay'>
      <div className='overlay-box'>
        <span role="img" aria-label="lose it all" style={{ fontSize: 64, marginBottom: 8 }}>💥</span>
        <h2 className="overlay-lose-it-all-title">{message}</h2>
      </div>
    </div>
  );
}