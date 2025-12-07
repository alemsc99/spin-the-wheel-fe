import * as React from 'react';
import { useState } from 'react';
import './StartScreen.css';
import { useTranslation } from '../../i18n/TranslationProvider';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

const MIN_PLAYERS = 1;
const MAX_PLAYERS = 4;


type StartScreenProps = {
  // onStart(players, names?)
  onStart: (players: number, names?: string[]) => void;
};

export default function StartScreen({ onStart }: StartScreenProps): React.ReactElement {
  const { lang, setLang, t } = useTranslation();
  const [players, setPlayers] = useState(MIN_PLAYERS);
  const [names, setNames] = useState([] as string[]);
  const [error, setError] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [rulesPage, setRulesPage] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const n = Number(e.target.value);
    setPlayers(n);
    setError('');
    if (n > 1) {
      setNames(Array(n).fill(''));
    } else {
      setNames([]);
    }
  };

  const handleNameChange = (idx: number, value: string) => {
    setNames((prev: string[]) => {
      const arr = [...prev];
      arr[idx] = value;
      return arr;
    });
    setError('');
  };

  const handleStart = () => {
    if (players === 1) {
      onStart(1);
    } else {
      const empty = names.findIndex(name => !name.trim());
      if (empty !== -1) {
        setError(t('error.emptyNames'));
        return;
      }
      // Controllo nomi duplicati (case insensitive, trim)
      const normalized = names.map(n => n.trim().toLowerCase());
      const hasDuplicates = normalized.some((name, idx) => normalized.indexOf(name) !== idx);
      if (hasDuplicates) {
        setError(t('error.duplicateNames'));
        return;
      }
      onStart(players, names);
    }
  };

  // Use translations from strings.json instead of hardcoded rules.
  const rulesLabel = t('start.rules');
  // rulesBody: array di oggetti { title, content }
  const _rawRulesBody: any = (t('start.rulesBody') as any);
  // fallback: se è stringa o array di stringhe legacy
  const rulesBody: Array<{ title: string; content: string[] }> = Array.isArray(_rawRulesBody) && typeof _rawRulesBody[0] === 'object'
    ? _rawRulesBody
    : Array.isArray(_rawRulesBody)
      ? _rawRulesBody.map((str: string, i: number) => ({ title: `Pagina ${i + 1}`, content: [str] }))
      : typeof _rawRulesBody === 'string'
        ? [{ title: 'Regole', content: _rawRulesBody.split('\n') }]
        : [];
  const disclaimer: any = (t('start.disclaimer') as any);

  const totalRulesPages = Math.max(1, rulesBody.length);
  const currentPage = rulesBody[rulesPage] || { title: '', content: [] };

  return (
    <div className="start-screen pretty-bg">
      {/* Elementi decorativi dinamici: stelle e cerchi */}
      <svg className="bg-decor bg-star star1" viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" fill="#ffd700"/></svg>
      <svg className="bg-decor bg-star star2" viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" fill="#ffd700"/></svg>
      <svg className="bg-decor bg-star star3" viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" fill="#ffd700"/></svg>
      <svg className="bg-decor bg-star star4" viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" fill="#ffd700"/></svg>
      <svg className="bg-decor bg-star star5" viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" fill="#ffd700"/></svg>
      <div className="bg-decor bg-circle c1"></div>
      <div className="bg-decor bg-circle c2"></div>
      <div className="bg-decor bg-circle c3"></div>
      <div className="bg-decor bg-circle c4"></div>
      <div className="bg-decor bg-circle c5"></div>
      <div className="start-card start-card-relative">
        {/* Rules button in the top-right inside the card */}
        <div className="rules-btn-container">
          <button
            type="button"
            className="rules-btn pretty-btn cute-rules-btn"
            aria-label={rulesLabel}
            onClick={() => {
              setRulesPage(0);
              setShowRules(true);
            }}
          >
            <span className="rules-btn-icon" role="img" aria-label="rules">📜</span>
            {rulesLabel}
          </button>
        </div>
        <h1 className="title fancy-title">{t('start.title')}</h1>
        <div className="players-select pretty-select">
          <div className="players-select-label-group">
            <label htmlFor="players" className="players-label">
              {t('players.label')}
            </label>
            <div className="custom-dropdown-wrapper">
              <select
                id="players"
                value={players}
                onChange={handleChange}
                className="select-dropdown custom-dropdown"
              >
                {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => (
                  <option key={i + MIN_PLAYERS} value={i + MIN_PLAYERS}>
                    {i + MIN_PLAYERS}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {(
          <div className="players-names">
            {Array.from({ length: players }, (_, i) => (
              <input
                key={i}
                type="text"
                className="player-name-input pretty-input"
                placeholder={`${t('player.placeholder')} ${i + 1}`}
                value={names[i] || ''}
                onChange={e => handleNameChange(i, e.target.value)}
                autoComplete="off"
              />
            ))}
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
        <div className="actions-row">
          <button className="start-btn pretty-btn" onClick={handleStart}>
            {t('start.button')}
          </button>
          <div className="lang-toggle" role="group" aria-label={t('start.langSelectionAria')}>
            <button
              type="button"
              className={`lang-btn ${lang === 'it' ? 'active' : ''}`}
              onClick={() => setLang('it')}
            >
                {t('lang.it')}
            </button>
            <button
              type="button"
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
                {t('lang.en')}
            </button>
          </div>
        </div>
        {showRules && (
          <div
            className="rules-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={currentPage.title}
            onClick={() => setShowRules(false)}
          >
            <div
              className="rules-modal pretty-card"
              onClick={e => e.stopPropagation()}
            >
              {/* Decorative icon */}
              <div className="rules-modal-icon-wrapper">
                <span className="rules-modal-icon" role="img" aria-label="wheel">🎡</span>
              </div>
              <h2 className="rules-modal-title">{currentPage.title}</h2>
              <div className="rules-content">
                <ol className="rules-list">
                  {currentPage.content.map((line, i) => (
                    <li key={i} className="rules-list-item" dangerouslySetInnerHTML={{ __html: line }}></li>
                  ))}
                </ol>
                <div className="rules-disclaimer">{disclaimer}</div>
                <div className="rules-pagination">
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <button
                      className="pretty-btn rules-page-btn"
                      disabled={rulesPage === 0}
                      onClick={() => setRulesPage(p => Math.max(0, p - 1))}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      {lang === 'it' ? 'Indietro' : 'Previous'}
                    </button>
                    <button
                      className="pretty-btn rules-page-btn"
                      disabled={rulesPage >= totalRulesPages - 1}
                      onClick={() => setRulesPage(p => Math.min(totalRulesPages - 1, p + 1))}
                      style={{ alignSelf: 'flex-end' }}
                    >
                      {lang === 'it' ? 'Avanti' : 'Next'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="rules-modal-footer">
                <button
                  className="pretty-btn rules-close-btn"
                  onClick={() => setShowRules(false)}
                >
                  {lang === 'it' ? 'Chiudi' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}