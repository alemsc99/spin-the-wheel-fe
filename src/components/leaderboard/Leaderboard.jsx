import './Leaderboard.css';
import { useTranslation } from '../../i18n/TranslationProvider';

/**
@param {{
   playerNames?: string[],
   playerScores?: Record<string, number>,
   firstPlayerIdx?: number | null,
   playerStatuses?: Record<string, { shield: boolean; banned: boolean }>,
   powerups?: Record<string, string[]>,
   recentDeductions?: Record<string, number>
 }} props
 */

export default function Leaderboard({ playerNames = [], playerScores = {}, firstPlayerIdx = null, playerStatuses = {}, powerups = {}, recentDeductions = {} }) {
  const { t } = useTranslation();

  return (
    <aside className="leaderboard-root">
      <h3 className="leaderboard-title">{t('players.title')}</h3>
      <div className="leaderboard-list">
        {playerNames.map((name, idx) => {
          const isActive = firstPlayerIdx === idx;

          let status = playerStatuses[name] || { shield: false, banned: false };
          // if backend provided the new `powerups` shape, prefer it
          if (powerups && Object.keys(powerups).length > 0) {
            const shieldList = Array.isArray(powerups.Shield) ? powerups.Shield : [];
            const bannedList = Array.isArray(powerups.Skip) ? powerups.Skip : [];
            status = {
              shield: shieldList.includes(name),
              banned: bannedList.includes(name),
            };
          }
          return (
            <div key={idx} className={`leaderboard-entry ${isActive ? 'active' : ''}`}>
              <div className="leaderboard-player">
                <span className="leaderboard-name" title={name}>{name}</span>
                {recentDeductions[name] > 0 && (
                 <span className="leaderboard-deduction" aria-live="polite">
                   - {recentDeductions[name]} €
                 </span>
               )}
                <span className="leaderboard-score">{(playerScores[name] ?? 0)} €</span>
              </div>
              {playerNames.length > 1 && (
              <div className="leaderboard-player-meta" aria-hidden={false}>
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
              </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
