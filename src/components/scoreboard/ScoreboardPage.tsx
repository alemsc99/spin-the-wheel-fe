import React from 'react';
import { useTranslation } from '../../i18n/TranslationProvider';
import '../start_screen/StartScreen.css';
import '../overlays/Overlays.css';
import './ScoreboardPage.css';

export type ScoreboardEntry = {
  name: string;
  score: number;
};

export default function ScoreboardPage({ ranking, onPlayAgain }: { ranking: ScoreboardEntry[]; onPlayAgain: () => void; }): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div className="scoreboard-page">
      <svg className="bg-star star1" style={{position:'absolute'}} viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" /></svg>
      <svg className="bg-star star2" style={{position:'absolute'}} viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" /></svg>
      <svg className="bg-star star3" style={{position:'absolute'}} viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" /></svg>
      <svg className="bg-star star4" style={{position:'absolute'}} viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" /></svg>
      <svg className="bg-star star5" style={{position:'absolute'}} viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" /></svg>
      <div className="bg-circle c1" style={{position:'absolute'}} />
      <div className="bg-circle c2" style={{position:'absolute'}} />
      <div className="bg-circle c3" style={{position:'absolute'}} />
      <div className="bg-circle c4" style={{position:'absolute'}} />
      <div className="bg-circle c5" style={{position:'absolute'}} />

      <div className="scoreboard-wrapper">
        <div className="scoreboard-card">
          <span className="trophy-icon">🏆</span>
          <h1 className="victory-title ">{t('victory.title')}</h1>
          <p className="subtitle">
            {t('victory.subtitle')} <span className="celebration-icon">🎉</span>
          </p>
          <div className="ranking-container">
            <h2 className="ranking-title">{t('victory.rankingTitle')}</h2>
            <ol className="ranking-list">
              {ranking.length === 0 ? (
                <li className="ranking-item">
                  <span className="ranking-name">{t('scoreboard.empty') || '—'}</span>
                </li>
              ) : (
                ranking.map((player, index) => (
                  <li key={player.name || index} className={`ranking-item${index === 0 ? ' first' : ''}`}>
                    <span className="ranking-pos">{index + 1}.</span>
                    <span className="ranking-name">{player.name}</span>
                    <span className="ranking-score">{player.score} €</span>
                  </li>
                ))
              )}
            </ol>
          </div>
          <div className="scoreboard-actions">
            <button type="button" className="play-again-btn" onClick={onPlayAgain}>
              <span className="sparkles-icon">✨</span>
              {t('victory.playAgain')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
