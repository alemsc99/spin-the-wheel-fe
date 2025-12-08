import * as React from 'react';
import { useState } from 'react';
import './StartScreen.css';
import { useLocation, useNavigate, Link } from 'react-router-dom'; // <--- 1. Aggiungi Link
import { Helmet } from 'react-helmet-async'; // <--- 2. Aggiungi Helmet per il JSON-LD
import { useTranslation, type Lang } from '../../i18n/TranslationProvider';
import { SEO } from '../SEO/SEO';

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
  onStart: (players: number, names?: string[]) => void;
};

export default function StartScreen({ onStart }: StartScreenProps): React.ReactElement {
  const { lang, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isIt = lang === 'it'; // Comodo per i check

  // --- DEFINIZIONE DATI STRUTTURATI (JSON-LD) ---
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": isIt ? "GiraParole" : "SpinWords",
    "description": isIt 
      ? "Gioco di parole e di enigmistica online gratuito. Gira la ruota, usa i powerups e indovina la frase prima degli altri giocatori." 
      : "Free online word puzzle game. Spin the wheel, use power-ups, and guess the phrase before other players.",
    "genre": ["Puzzle", "Word Game", "Trivia", "Enigmistic"],
    "url": "https://spinwords.pages.dev",
    "playMode": ["SinglePlayer", "Multiplayer"],
    "applicationCategory": "Game",
    "operatingSystem": "Any",
    "inLanguage": ["it", "en"],
    "author": {
      "@type": "Person",
      "name": "SpinWords Team"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR"
    }
  };
  // ----------------------------------------------

  const switchLanguage = (nextLang: Lang) => {
    if (nextLang === lang) {
      return;
    }
    const segments = location.pathname.split('/').filter(Boolean);
    const restSegments = segments.slice(1);
    const rest = restSegments.length ? `/${restSegments.join('/')}` : '';
    const targetPath = `/${nextLang}${rest}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  // Nota: openRulesPage non serve più se usiamo <Link>

  const [players, setPlayers] = useState(MIN_PLAYERS);
  const [names, setNames] = useState([] as string[]);
  const [error, setError] = useState('');

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
      const normalized = names.map(n => n.trim().toLowerCase());
      const hasDuplicates = normalized.some((name, idx) => normalized.indexOf(name) !== idx);
      if (hasDuplicates) {
        setError(t('error.duplicateNames'));
        return;
      }
      onStart(players, names);
    }
  };

  const rulesLabel = t('start.rules');

  return (
    <div className="start-screen pretty-bg">
      <SEO 
        title={isIt 
          ? "GiraParole - Gioco di Parole Online Gratis" 
          : "SpinWords - Free Online Word Puzzle Game"}
        description={isIt
          ? "Gioca a GiraParole online! Gira la ruota, scegli una consonante e indovina la frase segreta. Sfida gli amici o gioca da solo in questo puzzle game."
          : "Play SpinWords online! Spin the wheel, choose a consonant, and guess the secret phrase. Challenge your friends or play solo in this word puzzle game."}
        lang={lang as 'it' | 'en'}
        path=""
      />

      {/* --- INIEZIONE JSON-LD --- */}
      <Helmet>
        <script type="application/ld+json">
          {`
            ${JSON.stringify(schemaData)}
          `}
        </script>
      </Helmet>
      {/* ------------------------- */}

      {/* SVG Decorativi (Invariati) */}
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
        
        {/* --- MODIFICA IMPORTANTE: Link invece di Button --- */}
        <div className="rules-btn-container">
          <Link
            to="rules" // React Router gestirà il link relativo (es. /it/rules)
            className="rules-btn pretty-btn cute-rules-btn"
            aria-label={rulesLabel}
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} // Fix rapido per assicurarsi che sembri un bottone
          >
            <span className="rules-btn-icon" role="img" aria-label="rules">📜</span>
            {rulesLabel}
          </Link>
        </div>
        {/* ------------------------------------------------ */}

        <h1 className="title fancy-title">{t('start.title')}</h1>
        
        {/* ... Il resto del form (select players, inputs) rimane invariato ... */}
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
            {/* Link verso Italiano */}
            <Link
              to="/it"
              className={`lang-btn ${lang === 'it' ? 'active' : ''}`}
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
                {t('lang.it')}
            </Link>

            {/* Link verso Inglese */}
            <Link
              to="/en"
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
                {t('lang.en')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}