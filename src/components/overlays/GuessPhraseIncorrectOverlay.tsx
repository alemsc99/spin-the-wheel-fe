import { useTranslation } from "../../i18n/TranslationProvider";

export default function GuessPhraseIncorrectOverlay({ show, messageKey }: { show: boolean, messageKey: string}) {
    const { t } = useTranslation();
    if (!show) return null;
    const message = t(messageKey || '');
    return (
        <div className='overlay guess-phrase-incorrect-overlay'>
            <div className='overlay-box'>
                <span role="img" aria-label="incorrect" style={{ fontSize: 64, marginBottom: 8 }}>❌</span>
                <h2 className="overlay-guess-phrase-incorrect-title">{message}</h2>
                </div>
        </div>
    );
}   