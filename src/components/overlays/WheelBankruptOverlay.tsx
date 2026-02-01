import { useTranslation } from "../../i18n/TranslationProvider";

export default function WheelBankruptOverlay({ show, messageKey }: { show: boolean, messageKey: string}) {
    const { t } = useTranslation();
    if (!show) return null;
    const message = t(messageKey || '');
    return (
        <div className='overlay wheel-bankrupt-overlay'>
            <div className='overlay-box'>
                <span role="img" aria-label="bankrupt" style={{ fontSize: 64, marginBottom: 8 }}>🖤</span>
                <h2 className="overlay-wheel-bankrupt-title">{message}</h2>
                </div>
        </div>
    );
}