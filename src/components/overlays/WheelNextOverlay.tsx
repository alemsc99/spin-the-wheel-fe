import { useTranslation } from "../../i18n/TranslationProvider";

export default function WheelNextOverlay({ show, messageKey }: { show: boolean, messageKey: string}) {
    const { t } = useTranslation();
    if (!show) return null;
    const message = t(messageKey || '');
    return (
        <div className='overlay wheel-next-overlay'>
            <div className='overlay-box'>
                <span role="img" aria-label="next" style={{ fontSize: 64, marginBottom: 8 }}>➡️</span>
                <h2 className="overlay-wheel-next-title">{message}</h2>
                </div>
        </div>
    );
}