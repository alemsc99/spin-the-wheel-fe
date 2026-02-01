import { useTranslation } from "../../i18n/TranslationProvider";

export default function WrongLetterOverlay({ show, messageKey }: { show: boolean, messageKey: string}) {
  const { t } = useTranslation();
  if (!show) return null;
    const message = t(messageKey || '');
    return (
        <div className='overlay wrong-letter-overlay'>
            <div className='overlay-box'>
                <span role="img" aria-label="shield" style={{ fontSize: 64, marginBottom: 8 }}>❌</span>
                <h2 className="overlay-wrong-letter-title">{message}</h2>
            </div>
        </div>
    );
}