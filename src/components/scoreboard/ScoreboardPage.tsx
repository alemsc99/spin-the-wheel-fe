
import React from 'react';
import { useTranslation } from '../../i18n/TranslationProvider';
import strings from '../../i18n/strings.json';
import '../start_screen/StartScreen.css';
import '../overlays/Overlays.css';
import './ScoreboardPage.css';
import { Helmet } from 'react-helmet-async';


export type ScoreboardEntry = {
  name: string;
  score: number;
};

export default function ScoreboardPage({ ranking, onPlayAgain }: { ranking: ScoreboardEntry[]; onPlayAgain: () => void; }): React.ReactElement {
  const { t } = useTranslation();
  const translate = t as unknown as (key: string, options?: Record<string, unknown>) => unknown;
  let lang = (window.localStorage && window.localStorage.getItem('lang')) || 'it';

  // Se la pagina viene aperta senza ranking, mostra le regole
  const showRules = !ranking || ranking.length === 0;
  // Fix universale per i18next: usa returnObjects: true
  let rulesList: any = translate('scoreboard.rulesList', { returnObjects: true });
  // Fallback: se la traduzione restituisce letteralmente 'scoreboard.rulesList', prendi la lista dal json
  if (
    typeof rulesList === 'string' &&
    rulesList.trim() === 'scoreboard.rulesList'
  ) {
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
  const pathSegments = window.location.pathname.split('/');
  const langFromUrl = pathSegments.find(seg => seg === 'en' || seg === 'it');
  const currentLang = langFromUrl || 'en'; // Fallback a 'en' se non trovato
  let metaTitle = '';
  let metaDescription = '';
  let metaKeywords = '';
  if (currentLang === 'it') {
    // ITALIANO
    metaTitle = showRules 
      ? t('scoreboard.rulesTitle') + " - GiraParole" 
      : "Partita Terminata - GiraParole";
      
    metaDescription = showRules 
      ? "Leggi le regole ufficiali di GiraParole. Scopri come girare la ruota, risolvere i puzzle e competere con gli amici."
      : "Guarda i punteggi finali e scopri chi ha vinto la partita a GiraParole!";

    metaKeywords = showRules
      ? "regole punteggio gioco online, gioco della ruota online, gioco multiplayer online, gioco a punteggio online, indovina la frase, bonus punteggio gioco"
      : "punteggi finali, classifica, vincitore, partita terminata, GiraParole";

  } else {
    // INGLESE (Default)
    metaTitle = showRules 
      ? (t('scoreboard.rulesTitle') || "Game Rules") + " - SpinWords" 
      : "Game Over - SpinWords";

    metaDescription = showRules 
      ? "Read the official rules for SpinWords. Learn how to spin the wheel, solve puzzles, and compete with friends." 
      : "Check out the final scores and see who won the SpinWords match!";

    metaKeywords = showRules
      ? "game rules, online wheel game, online multiplayer game, online scoring game, phrase guessing, score bonuses"
      : "final scores, leaderboard, winner, game over, SpinWords";
  }
  const canonicalPath = showRules ? 'rules' : 'scoreboard';
  const canonicalUrl = `https://spinwords.pages.dev/${currentLang}/${canonicalPath}`;


  return (
    <div className="scoreboard-page">
      {/* Sostituisci i meta tag per questa pagina specifica */}
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Aggiungi anche qui Open Graph per completezza */}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="keywords" content={metaKeywords} />
      </Helmet>
      
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
                      {idx === 0 && ''}
                      {idx === 1 && ''}
                      {idx === 2 && ''}
                      {idx === 3 && ''}
                      {idx > 3 && ''}
                    </span>
                    <span className="scoreboard-rule-desc" dangerouslySetInnerHTML={{ __html: rule }} />
                  </li>
                ))}
              </ul>
              {/* <p className="rules-note">{rulesNote}</p> */}
            </div>
          ) : (
            <>
              <span className="trophy-icon">🏆</span>
              <h1 className="victory-title ">{t('victory.title')}</h1>
              <p className="subtitle">
                {t('victory.subtitle')}{ranking[0]?.name}!
                <span className="celebration-icon">🎉</span>
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
