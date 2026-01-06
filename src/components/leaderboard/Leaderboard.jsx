import './Leaderboard.css';
import { useTranslation } from '../../i18n/TranslationProvider';

/**
@param {{
   playerNames?: string[],
   playerScores?: Record<string, number>,
   firstPlayerIdx?: number | null,
   playerStatuses?: Record<string, { shield: boolean; banned: boolean }>,
   powerups?: Record<string, string[]>,
   recentDeductions?: Record<string, number>,
   scoreChanges?: Record<string, number>
 }} props
 */

export default function Leaderboard({ 
  playerNames = [], 
  playerScores = {}, 
  firstPlayerIdx = null, 
  playerStatuses = {}, 
  powerups = {}, 
  recentDeductions = {}, 
  scoreChanges 
}) {
  const { t } = useTranslation();
  const changes = scoreChanges ?? recentDeductions ?? {};

  return (
    <aside className="leaderboard-root">
      <h3 className="leaderboard-title">{t('players.title')}</h3>
      <div className="leaderboard-list">
        {playerNames.map((name, idx) => {
          const isActive = firstPlayerIdx === idx;

          // Calcolo dello stato del giocatore (Powerups attivi)
          let status = playerStatuses[name] || { shield: false, banned: false, double: false };
          
          if (powerups && Object.keys(powerups).length > 0) {
            status = {
              shield: (powerups.Shield || []).includes(name),
              banned: (powerups.Skip || []).includes(name),
              double: (powerups.Double || []).includes(name),
            };
          }
          
          const changeVal = changes[name];

          return (
            <div key={idx} className={`leaderboard-entry ${isActive ? 'active' : ''}`}>
              
              {/* 1. PARTE SUPERIORE: Nome e Animazione Punteggio */}
              <div className="leaderboard-player">
                <span className="leaderboard-name" title={name}>{name}</span>
                {changeVal !== undefined && changeVal !== 0 && (
                  <span 
                    className={`leaderboard-change ${changeVal > 0 ? 'positive' : 'negative'}`} 
                    aria-live="polite"
                  >
                    {changeVal > 0 ? '+' : ''}{changeVal}🪙
                  </span>
                )}
              </div>

              {/* 2. PARTE CENTRALE: Icone di Stato (Shield, Ban, Double) */}
              {playerNames.length > 1 && (
                <div className="leaderboard-player-meta">
                  <span
                    className={`status-icon shield ${status.shield ? 'active' : 'inactive'}`}
                    title={status.shield ? t('players.shield_on') : t('players.shield_off')}
                  >
                    🛡️
                  </span>
                  <span
                    className={`status-icon ban ${status.banned ? 'active' : 'inactive'}`}
                    title={status.banned ? t('players.ban_on') : t('players.ban_off')}
                  >
                    🚫
                  </span>
                  <span
                    className={`status-icon double ${status.double ? 'active' : 'inactive'}`}
                    title={status.double ? t('players.double_on') : t('players.double_off')}
                  >
                    💰
                  </span>
                </div>
              )}

              {/* 3. PARTE INFERIORE: Punteggio */}
              <div className="leaderboard-score-container">
                <span className="leaderboard-score">
                  {(playerScores[name] ?? 0)}🪙
                </span>
              </div>

            </div>
          );
        })}
      </div>
    </aside>
  );
}