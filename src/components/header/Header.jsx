import { useEffect, useState } from 'react';
import './Header.css';
import { useTranslation } from '../../i18n/TranslationProvider';

export default function Header() {
  const [titleRotating, setTitleRotating] = useState(false);
  const { t } = useTranslation();

  function handleTitleClick() {
    setTitleRotating(true);
    setTimeout(() => setTitleRotating(false), 900);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleRotating(true);
      setTimeout(() => setTitleRotating(false), 900);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header-bar">
      <h1
        className={`fancy-title${titleRotating ? ' rotating' : ''}`}
        onClick={handleTitleClick}
        title={t('start.title')}
      >
        <span role="img" aria-label="wheel" className="header-wheel-icon">🌀</span>
        {t('start.title')}
      </h1>
    </header>
  );
}
