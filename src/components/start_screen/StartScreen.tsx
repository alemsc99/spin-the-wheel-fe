import * as React from 'react';
import { useState } from 'react';
import './StartScreen.css';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async'; 
import { useTranslation, type Lang } from '../../i18n/TranslationProvider';
import { SEO } from '../SEO/SEO';
import { API_URL } from '../../constants/constants';
import LoadingSpinner from '../loading_spinner/LoadingSpinner';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

const MIN_PLAYERS = 1;
const MAX_PLAYERS = 4;

export type GameMode = 'single' | 'local' | 'online';
export type OnlineSubMode = 'create' | 'join';

export interface StartGameOptions {
  players: number;
  names: string[];
  mode: GameMode;
  onlineSubMode?: OnlineSubMode;
  roomCode?: string;
}

type StartScreenProps = {
  onStart: (options: StartGameOptions) => void;
};

export default function StartScreen({ onStart }: StartScreenProps): React.ReactElement {
  const { lang, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isWakingUp, setIsWakingUp] = useState(false);
  
  const isIt = lang === 'it'; // Comodo per i check
  const loadingPhrases = isIt 
    ? [
      "Preparando la ruota...",
      "Caricando i giocatori...",
      "Mescolando le lettere segrete...",
      "Ricaricando i power-up..."
    ]
    : [
      "Preparing the wheel...",
      "Loading players...",
      "Shuffling secret letters...",
      "Recharging power-ups..."
      ];
  // State for cycling loading phrases
  const [loadingPhraseIdx, setLoadingPhraseIdx] = useState(0);
  React.useEffect(() => {
    if (!isWakingUp || loadingPhrases.length === 0) return;
    const interval = setInterval(() => {
      setLoadingPhraseIdx(idx => (idx + 1) % loadingPhrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isWakingUp, loadingPhrases.length]);

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
    "image": "https://spinwords.pages.dev/og-image-v2.jpg",
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


  const [gameMode, setGameMode] = useState<GameMode>('single');
  const [onlineSubMode, setOnlineSubMode] = useState<OnlineSubMode>('create');
  const [players, setPlayers] = useState(MIN_PLAYERS);
  const [names, setNames] = useState([] as string[]);
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    setError('');
    
    if (mode === 'single') {
      setPlayers(1);
      setNames([]);
    } 
    else if (mode === 'local') {
      setPlayers(2);
      setNames(['', '']);
    }
    else if (mode === 'online') {
      setOnlineSubMode('create');
      setPlayers(2); // Default for online create
      setNames(['']); // One input for me (creator)
    }
  };

  const handleOnlineSubModeChange = (subMode: OnlineSubMode) => {
    setOnlineSubMode(subMode);
    setError('');
    
    if (subMode === 'create') {
      setPlayers(2);
      setNames(['']); // One name for Creator
    } else {
      setPlayers(1); // Conceptually 1 "local" player joining
      setNames(['']); 
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const n = Number(e.target.value);
    setPlayers(n);
    setError('');
    if (gameMode === 'local') {
      if (n > 1) {
        setNames(Array(n).fill(''));
      } else {
        setNames([]);
      }
    } else if (gameMode === 'online') {
        setNames((prev) => {
            if (prev.length === 0) return [''];
            return prev.slice(0, 1); // Ensure only 1 name
        });
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

  const handleStart = async () => {
    // 1. PRIMA fai le validazioni (nomi vuoti, duplicati, ecc.)
    if (gameMode === 'online') {
        const myName = names[0] || '';
        if (!myName.trim()) {
           setError(t('error.emptyNames'));
           return;
        }
        if (onlineSubMode === 'join' && !roomCode.trim()) {
            setError(t('error.emptyRoomCode') || 'Enter a room code');
            return;
        }
    } else if (gameMode === 'local' && players > 1) {
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
    } else if (gameMode === 'single') {
        // Single player - names handling if any
        if (names.length > 0 && !names[0].trim()) {
             // Maybe optional? Current logic allows empty?
        }
    }

    setIsWakingUp(true);
    let awake = false;
    
    while (!awake) {
      try {
        const res = await fetch(`${API_URL}/health`, { cache: 'no-store' });
        if (res.ok) {
          awake = true;
        } else {
          // Se il server risponde ma con errore, aspetta 2 secondi
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (err) {
        // Se il fetch fallisce (server ancora "giù"), aspetta 2 secondi
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 3. Una volta che il server è sveglio, togli lo spinner
    setIsWakingUp(false);

    // 4. SOLO ORA avvia il gioco
    onStart({
      players,
      names: names.length > 0 ? names : [], // Ensure array
      mode: gameMode,
      onlineSubMode: gameMode === 'online' ? onlineSubMode : undefined,
      roomCode: (gameMode === 'online' && onlineSubMode === 'join') ? roomCode : undefined
    });
  };

  const rulesLabel = t('start.rules');

  return (
    <div className="start-screen pretty-bg">
      {isWakingUp && (
        <div className="loading-overlay">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: '24px' }}>
              <LoadingSpinner />
            </div>
            {loadingPhrases.length > 0 && (
              <div className="loading-text">
                {loadingPhrases[loadingPhraseIdx]}
              </div>
            )}
          </div>
        </div>
      )}
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

        <div className="game-mode-toggles">
          <button 
            className={`mode-btn ${gameMode === 'single' ? 'active' : ''}`} 
            onClick={() => handleModeChange('single')}
          >
            {t('start.mode.single')}
          </button>
          <button 
            className={`mode-btn ${gameMode === 'local' ? 'active' : ''}`} 
            onClick={() => handleModeChange('local')}
          >
            {t('start.mode.local')}
          </button>
          <button 
            className={`mode-btn ${gameMode === 'online' ? 'active' : ''}`} 
            onClick={() => handleModeChange('online')}
          >
            {t('start.mode.online')}
          </button>
        </div>

        {gameMode === 'online' && (
          <div className="game-mode-toggles sub-toggles" style={{ marginTop: '0px' }}>
            <button 
              className={`mode-btn sub-mode-btn ${onlineSubMode === 'create' ? 'active' : ''}`} 
              onClick={() => handleOnlineSubModeChange('create')}
            >
              {t('start.submode.create')}
            </button>
            <button 
              className={`mode-btn sub-mode-btn ${onlineSubMode === 'join' ? 'active' : ''}`} 
              onClick={() => handleOnlineSubModeChange('join')}
            >
              {t('start.submode.join')}
            </button>
          </div>
        )}
        
        {/* ... Il resto del form (select players, inputs) rimane invariato ... */}
        {(gameMode === 'local' || (gameMode === 'online' && onlineSubMode === 'create')) && (
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
                  {Array.from({ length: 3 }, (_, i) => (
                    <option key={i + 2} value={i + 2}>
                      {i + 2}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        {(
          <div className="players-names">
             {gameMode === 'online' ? (
                <>
                  {onlineSubMode === 'join' && (
                     <input
                        type="text"
                        className="player-name-input pretty-input"
                        placeholder={t('start.roomCode.placeholder')}
                        value={roomCode}
                        onChange={e => setRoomCode(e.target.value)}
                        autoComplete="off"
                        style={{ marginBottom: '10px' }}
                     />
                  )}
                  {/* Always show one name input for online mode (My Name) */}
                  <input
                    type="text"
                    className="player-name-input pretty-input"
                    placeholder={t('player.placeholder')} 
                    value={names[0] || ''}
                    onChange={e => handleNameChange(0, e.target.value)}
                    autoComplete="off"
                  />
                </>
             ) : (
                /* Local or Single */
                Array.from({ length: players }, (_, i) => (
                  <input
                    key={i}
                    type="text"
                    className="player-name-input pretty-input"
                    placeholder={`${t('player.placeholder')} ${i + 1}`}
                    value={names[i] || ''}
                    onChange={e => handleNameChange(i, e.target.value)}
                    autoComplete="off"
                  />
                ))
             )}
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
        <div className="actions-row">
          <button className="start-btn pretty-btn" onClick={handleStart}>
            {gameMode === 'online' 
               ? (onlineSubMode === 'create' ? t('start.button.create') : t('start.button.join'))
               : t('start.button')
            }
          </button>
          {!(gameMode === 'online' && onlineSubMode === 'join') && (
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
          )}
        </div>
      </div>
    </div>
  );
}