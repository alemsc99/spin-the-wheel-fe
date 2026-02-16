
import React from 'react';
import { useTranslation } from '../../i18n/TranslationProvider';
import strings from '../../i18n/strings.json';
import '../start_screen/StartScreen.css';
import '../overlays/Overlays.css';
import './ScoreboardPage.css';
import { SEO } from '../SEO/SEO';

export type ScoreboardEntry = {
  name: string;
  score: number;
};

export default function ScoreboardPage({ ranking, onPlayAgain }: { ranking: ScoreboardEntry[]; onPlayAgain: () => void; }): React.ReactElement {
  const { t } = useTranslation();
  const translate = t as unknown as (key: string, options?: Record<string, unknown>) => unknown;
  
  // Se la pagina viene aperta senza ranking, mostra le regole
  const showRules = !ranking || ranking.length === 0;
  // Fix universale per i18next: usa returnObjects: true
  let rulesList: any = translate('scoreboard.rulesList', { returnObjects: true });
  // Fallback: se la traduzione restituisce letteralmente 'scoreboard.rulesList', prendi la lista dal json
  if (
    typeof rulesList === 'string' &&
    rulesList.trim() === 'scoreboard.rulesList'
  ) {
    // Determina la lingua attiva (default 'it')
    let lang = 'it';
    try {
      // @ts-ignore
      lang = (window.localStorage && window.localStorage.getItem('lang')) || 'it';
    } catch {}
    // @ts-ignore
    rulesList = (strings as any)[lang]?.['scoreboard.rulesList'] || [];
  }
  if (!Array.isArray(rulesList)) {
    const rulesListRaw = translate('scoreboard.rulesList');
    if (Array.isArray(rulesListRaw)) {
      rulesList = rulesListRaw;
    } else if (typeof rulesListRaw === 'string') {
      try {
        rulesList = JSON.parse(rulesListRaw);
      } catch {
        rulesList = [rulesListRaw];
      }
    } else {
      rulesList = [];
    }
  }
  const rulesTitle = t('scoreboard.rulesTitle');
  rulesList = Array.isArray(rulesList) ? rulesList : [];
  rulesList = rulesList as string[];

  return (
    <div className="scoreboard-page">
      <SEO
        title={window.localStorage.getItem('lang') === 'it'
          ? "Classifica Finale - GiraParole | Risultati Partita"
          : "Final Scores - SpinWords | Game Results & Rankings"}
        description={window.localStorage.getItem('lang') === 'it'
          ? "Scopri chi ha vinto a GiraParole! Consulta la classifica finale, i punteggi dei giocatori e gioca ancora al gioco di parole online."
          : "See who won at SpinWords! Check out the final rankings, player scores and play the online word game again."}
        lang={window.localStorage.getItem('lang') as 'it' | 'en'}
        path="/scoreboard"
      />
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
          {showRules ? (
            <div className="scoreboard-rules">
              <h1 className="scoreboard-rules-title">
                <span role="img" aria-label="lightbulb">💡</span>
                {rulesTitle}
              </h1>
              <ul className="scoreboard-rules-list">
                {rulesList.map((rule: any, idx: number) => (
                  <li key={idx}>
                    <span className="scoreboard-rule-icon" aria-hidden="true">
                      {idx === 0 && '🔠'}
                      {idx === 1 && '🛠️'}
                      {idx === 2 && '💸'}
                      {idx === 3 && '🎁'}
                      {idx > 3 && '⭐'}
                    </span>
                    <span className="scoreboard-rule-desc" dangerouslySetInnerHTML={{ __html: rule }} />
                  </li>
                ))}
              </ul>
              {/* <p className="rules-note">{rulesNote}</p> */}
            </div>
          ) : (
            <>
            <SEO
              title={window.localStorage.getItem('lang') === 'it'
                ? "Vincitore GiraParole - Classifica Finale | Gioco di Parole Online"
                : "SpinWords Winner - Final Rankings | Free Online Word Game"}
              description={window.localStorage.getItem('lang') === 'it'
                ? "Chi ha vinto a GiraParole? Scopri la classifica finale dei giocatori e gioca ancora al gioco di parole online."
                : "Who won SpinWords? Check out the final player rankings and play the online word game again."}
              lang={window.localStorage.getItem('lang') as 'it' | 'en'}
              path="/scoreboard"
            />
              <span className="trophy-icon">🏆</span>
              <h1 className="victory-title ">{t('victory.title')}</h1>
              <p className="subtitle">
                {t('victory.subtitle')} <span className="celebration-icon">🎉</span>
              </p>
              <div className="ranking-container">
                <h2 className="ranking-title">{t('victory.rankingTitle')}</h2>
                <ol className="ranking-list">
                  {ranking.map((player, index) => (
                    <li key={player.name || index} className={`ranking-item${index === 0 ? ' first' : ''}`}>
                      <span className="ranking-pos">{index + 1}.</span>
                      <span className="ranking-name">{player.name}</span>
                      <span className="ranking-score">{player.score}🪙</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="scoreboard-actions">
                <button type="button" className="play-again-btn" onClick={onPlayAgain}>
                  <span className="sparkles-icon">✨</span>
                  {t('victory.playAgain')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
