import './Overlays.css';
import { useTranslation } from '../../i18n/TranslationProvider';

export function VictoryOverlay({ show, onNewGame, ranking }) {
  const { t } = useTranslation();
  if (!show) return null;

  return (
    <div className="overlay victory-overlay">
      <div className="overlay-box victory-box">
  <span role="img" aria-label="trophy" className="overlay-trophy-icon">🏆</span>
        <h2 className="overlay-title victory-title">{t('victory.title')}</h2>
        <p className="overlay-text">
          {t('victory.subtitle')} <span className="overlay-celebration-icon">🎉</span>
        </p>
        <div className="victory-ranking-container">
          <h3 className="victory-ranking-title">{t('victory.rankingTitle')}</h3>
          <ol className="victory-ranking-list">
            {ranking && ranking.map((p, i) => (
              <li key={p.name} className={`victory-ranking-item${i === 0 ? ' first' : ''}`}>
                <span className="victory-ranking-pos">{i + 1}.</span>
                <span className="victory-ranking-name">{p.name}</span>
                <span className="victory-ranking-score">{p.score} €</span>
              </li>
            ))}
          </ol>
        </div>
        <button className="overlay-button victory-button" onClick={onNewGame}>
          <span role="img" aria-label="sparkles" className="overlay-sparkles-icon">✨</span>
          {t('victory.playAgain')}
        </button>
      </div>
    </div>
  );
}


export function ErrorOverlay({ show, message }) {
  if (!show) return null;

  const { t } = useTranslation();

  return (
    <div className="overlay error-overlay">
      <div className="overlay-box error-box">
  <span role="img" aria-label="warning" className="overlay-warning-icon">⚠️</span>
        <h2 className="overlay-title error-title">{t('overlay.attention')}</h2>
        <p className="overlay-text">{message}</p>
      </div>
    </div>
  );
}
