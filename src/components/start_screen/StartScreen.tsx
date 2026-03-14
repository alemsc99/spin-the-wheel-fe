import * as React from 'react';
import { useState } from 'react';
import './StartScreen.css';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from '../../i18n/TranslationProvider';
import { AnimatePresence, motion } from 'framer-motion';

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
  category?: 'random' | 'food' | 'travel' | 'sports' | 'music' | 'technology';
}

type StartScreenProps = {
  onStart: (options: StartGameOptions) => void;
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

export default function StartScreen({ onStart }: StartScreenProps): React.ReactElement {
  const { lang, t } = useTranslation();
  const navigate = useNavigate();
  const [isWakingUp, setIsWakingUp] = useState(false);

  const isIt = lang === 'it';
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
  const [loadingPhraseIdx, setLoadingPhraseIdx] = useState(0);
  React.useEffect(() => {
    if (!isWakingUp || loadingPhrases.length === 0) return;
    const interval = setInterval(() => {
      setLoadingPhraseIdx(idx => (idx + 1) % loadingPhrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isWakingUp, loadingPhrases.length]);

  // --- JSON-LD ---
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": isIt ? "GiraParole" : "SpinWords",
    "description": isIt
      ? "Gioco di parole e di enigmistica online gratuito. Gira la ruota, usa i powerups e indovina la frase prima degli altri giocatori."
      : "Free online word puzzle game. Spin the wheel, use power-ups, and guess the phrase before other players.",
    "genre": ["Puzzle", "Word Game", "Trivia", "Enigmistic"],
    "url": "https://spinwords.pages.dev",
    "playMode": ["SinglePlayer", "MultiPlayer"],
    "applicationCategory": "Game",
    "gamePlatform": ["Web Browser", "Desktop", "Mobile"],
    "numberOfPlayers": {
      "@type": "QuantitativeValue",
      "minValue": 1,
      "maxValue": 4
    },
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
      "priceCurrency": "EUR",
      "category": "free"
    }
  };

  const metaTitle = isIt
    ? "GiraParole - Gioco Enigmistico Online Gratis"
    : "SpinWords -  Online Word Game";
  const metaDescription = isIt
    ? "Gioca a GiraParole online gratis! Gira la ruota, indovina le consonanti e risolvi la frase misteriosa prima dei tuoi amici."
    : "Play SpinWords online for free! Spin the wheel, guess consonants, and solve the mystery phrase before your friends.";

  // --- Carousel state ---
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // --- Game state ---
  const [gameMode, setGameMode] = useState<GameMode>('single');
  const [onlineSubMode, setOnlineSubMode] = useState<OnlineSubMode>('create');
  const [players, setPlayers] = useState(MIN_PLAYERS);
  const [names, setNames] = useState([] as string[]);
  const [roomCode, setRoomCode] = useState('');
  const [category, setCategory] = useState<'random' | 'food' | 'travel' | 'sports' | 'music' | 'technology'>('random');
  const [error, setError] = useState('');

  const handleModeChange = (mode: GameMode, subMode?: OnlineSubMode) => {
    setGameMode(mode);
    setError('');

    if (mode === 'single') {
      setPlayers(1);
      setNames(['']);
    }
    else if (mode === 'local') {
      setPlayers(2);
      setNames(['', '']);
    }
    else if (mode === 'online') {
      const sm = subMode || 'create';
      setOnlineSubMode(sm);
      if (sm === 'create') {
        setPlayers(2);
        setNames(['']);
      } else {
        setPlayers(1);
        setNames(['']);
        // join has only 2 steps, clamp if needed
        setStep(s => Math.min(s, 1));
      }
    }
  };

  const handleOnlineSubModeChange = (subMode: OnlineSubMode) => {
    setOnlineSubMode(subMode);
    setError('');

    if (subMode === 'create') {
      setPlayers(2);
      setNames(['']);
    } else {
      setPlayers(1);
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
            return prev.slice(0, 1);
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

  // --- Validation for step transitions ---
  const validateStep1 = (): boolean => {
    if (gameMode === 'online') {
      const myName = names[0] || '';
      if (!myName.trim()) {
        setError(t('error.emptyNames'));
        return false;
      }
      if (onlineSubMode === 'join' && !roomCode.trim()) {
        setError(t('error.emptyRoomCode') || 'Enter a room code');
        return false;
      }
    } else if (gameMode === 'local' && players > 1) {
      const empty = names.findIndex(name => !name.trim());
      if (empty !== -1) {
        setError(t('error.emptyNames'));
        return false;
      }
      const normalized = names.map(n => n.trim().toLowerCase());
      const hasDuplicates = normalized.some((name, idx) => normalized.indexOf(name) !== idx);
      if (hasDuplicates) {
        setError(t('error.duplicateNames'));
        return false;
      }
    } else if (gameMode === 'single') {
      if (names.length > 0 && names[0] && !names[0].trim()) {
        // Allow empty name for single player (optional)
      }
    }
    return true;
  };

  const isJoin = gameMode === 'online' && onlineSubMode === 'join';
  const maxStep = isJoin ? 1 : 2;

  const goNext = () => {
    if (step === 1) {
      if (!validateStep1()) return;
    }
    setError('');
    setDirection(1);
    setStep(s => Math.min(s + 1, maxStep));
  };

  const goBack = () => {
    setError('');
    setDirection(-1);
    setStep(s => Math.max(s - 1, 0));
  };

  const handleStart = async () => {
    setIsWakingUp(true);
    let awake = false;

    while (!awake) {
      try {
        const res = await fetch(`${API_URL}/health`, { cache: 'no-store' });
        if (res.ok) {
          awake = true;
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (err) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsWakingUp(false);

    onStart({
      players,
      names: names.length > 0 ? names : [],
      mode: gameMode,
      onlineSubMode: gameMode === 'online' ? onlineSubMode : undefined,
      roomCode: (gameMode === 'online' && onlineSubMode === 'join') ? roomCode : undefined,
      category,
    });
  };

  const rulesLabel = t('start.rules');

  // --- Render step content ---
  const renderStep0 = () => (
    <div className="carousel-step">
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
          className={`mode-btn ${gameMode === 'online' && onlineSubMode === 'create' ? 'active' : ''}`}
          onClick={() => handleModeChange('online', 'create')}
        >
          {t('start.submode.create')}
        </button>
        <button
          className={`mode-btn ${gameMode === 'online' && onlineSubMode === 'join' ? 'active' : ''}`}
          onClick={() => handleModeChange('online', 'join')}
        >
          {t('start.submode.join')}
        </button>
      </div>

      <div className="lang-toggle carousel-lang-toggle" role="group" aria-label={t('start.langSelectionAria')}>
        <Link
          to="/it"
          className={`lang-btn ${lang === 'it' ? 'active' : ''}`}
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {t('lang.it')}
        </Link>
        <Link
          to="/en"
          className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {t('lang.en')}
        </Link>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="carousel-step">
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

      <div className={`players-names ${gameMode === 'online' ? 'players-names-column' : ''}`}>
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
          Array.from({ length: gameMode === 'single' ? 1 : players }, (_, i) => (
            <input
              key={i}
              type="text"
              className="player-name-input pretty-input"
              placeholder={gameMode === 'single' ? t('player.placeholder') : `${t('player.placeholder')} ${i + 1}`}
              value={names[i] || ''}
              onChange={e => handleNameChange(i, e.target.value)}
              autoComplete="off"
            />
          ))
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );

  const renderStep2 = () => (
    <div className="carousel-step">
      <h3 className="category-title">{t('carousel.category')}</h3>
      <div className="category-toggles">
        <button
          className={`mode-btn category-btn ${category === 'random' ? 'active' : ''}`}
          onClick={() => setCategory('random')}
        >
          🎲 {t('carousel.categoryRandom')}
        </button>
        <button
          className={`mode-btn category-btn ${category === 'food' ? 'active' : ''}`}
          onClick={() => setCategory('food')}
        >
          🍕 {t('carousel.categoryFood')}
        </button>
        <button
          className={`mode-btn category-btn ${category === 'travel' ? 'active' : ''}`}
          onClick={() => setCategory('travel')}
        >
          ✈️ {t('carousel.categoryTravel')}
        </button>
        <button
          className={`mode-btn category-btn ${category === 'sports' ? 'active' : ''}`}
          onClick={() => setCategory('sports')}
        >
          ⚽ {t('carousel.categorySports')}
        </button>
        <button
          className={`mode-btn category-btn ${category === 'music' ? 'active' : ''}`}
          onClick={() => setCategory('music')}
        >
          🎵 {t('carousel.categoryMusic')}
        </button>
        <button
          className={`mode-btn category-btn ${category === 'technology' ? 'active' : ''}`}
          onClick={() => setCategory('technology')}
        >
          💻 {t('carousel.categoryTechnology')}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );

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

      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <script type="application/ld+json">
          {`
            ${JSON.stringify(schemaData)}
          `}
        </script>
      </Helmet>

      {/* SVG Decorativi */}
      <svg className="bg-decor bg-star star1" viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" fill="#ffd700"/></svg>
      <svg className="bg-decor bg-star star2" viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" fill="#ffd700"/></svg>
      <svg className="bg-decor bg-star star5" viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" fill="#ffd700"/></svg>
      <div className="bg-decor bg-circle c1"></div>
      <div className="bg-decor bg-circle c2"></div>
      <div className="bg-decor bg-circle c3"></div>
      <div className="bg-decor bg-circle c4"></div>
      <div className="bg-decor bg-circle c5"></div>

      <div className="start-card start-card-relative">

        <div className="rules-btn-container">
          <Link
            to="rules"
            className="rules-btn pretty-btn cute-rules-btn"
            aria-label={rulesLabel}
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span className="rules-btn-icon" role="img" aria-label="rules">📜</span>
            {rulesLabel}
          </Link>
        </div>

        <h1 className="title fancy-title">
          {isIt ? "GiraParole" : "SpinWords"}
        </h1>

        {/* Carousel container */}
        <div className="carousel-container">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {step === 0 && renderStep0()}
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
            </motion.div>
          </AnimatePresence>
        </div>
         {/* Step indicator dots */}
        <div className="step-dots">
          {Array.from({ length: maxStep + 1 }, (_, i) => (
            <span key={i} className={`step-dot ${step === i ? 'active' : ''}`} />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="carousel-nav">
          {step > 0 ? (
            <button className="carousel-nav-btn back-btn" onClick={goBack}>
              {t('carousel.back')}
            </button>
          ) : (
            <div className="carousel-nav-spacer" />
          )}
          {step < maxStep ? (
            <button className="carousel-nav-btn next-btn" onClick={goNext}>
              {t('carousel.next')}
            </button>
          ) : (
            <button className="carousel-nav-btn next-btn" onClick={handleStart}>
              {gameMode === 'online'
                ? (onlineSubMode === 'create' ? t('start.button.create') : t('start.button.join'))
                : t('start.button')
              }
            </button>
          )}
        </div>
      </div>

      {/* SEO content */}
      <article className="seo-content-container" style={{
          maxWidth: '800px',
          margin: '40px auto',
          padding: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '15px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          color: '#333',
          lineHeight: '1.6',
          fontSize: '1rem',
          textAlign: 'left'
      }}>
        {isIt ? (
          <>
            <h2 style={{ color: '#d91b5c', marginTop: 0 }}>Il più divertente dei giochi da fare con gli amici</h2>
            <p>
              GiraParole è tra i <strong>giochi enigmistici</strong> perfetti per gli appassionati dei giochi di parole.
              Gira la ruota, chiama le consonanti, compra le vocali e <strong>indovina la frase</strong> prima dei tuoi avversari!
            </p>
            <h4 style={{ color: '#d91b5c', marginTop: 0 }}>Caratteristiche del gioco:</h4>
            <ul style={{ paddingLeft: '20px' }}>
              <li>🕹️ <strong>Modalità Single Player:</strong> Allenati per migliorare le tue abilità di nei <strong>giochi enigmistici</strong>.</li>
              <li>👥 <strong>Multiplayer Locale:</strong> Sfida amici e parenti sullo stesso dispositivo.</li>
              <li>🌍 <strong>Multiplayer Online:</strong> Crea stanze private e gioca a distanza con chiunque.</li>
              <li>🎡 <strong>Ruota:</strong> guadagna punti ma fai attenzione alle insidie nascoste, potresti perdere tutto!</li>
              <li>⚡ <strong>Potenziamenti:</strong> Sblocca potenziamenti strategici per avere un vantaggio suoi tuoi avversari!</li>
              <li>🔄 <strong>Sorpresa di metà partita:</strong> A metà gioco, un rullo verticale sconvolge completamente le sorti della partita: moltiplicatori, azzeramento punti o cambio della frase misteriosa. Tutto può cambiare!</li>
            </ul>
            <p>
              Perfetto per gli amanti dei cruciverba, dei puzzle e dei giochi di società. Non serve scaricare nulla: gioca direttamente dal browser su PC, tablet o smartphone e <strong>indovina la frase!</strong>
            </p>
          </>
        ) : (
          <>
            <h2 style={{ color: '#d91b5c', marginTop: 0 }}>The Funniest Free Online Word Game</h2>
            <p>
              SpinWords is a <strong>free puzzle word game</strong> perfect for word game enthusiasts.
              Spin the wheel, guess the consonants, buy vowels, and solve the hidden phrase before your opponents!
            </p>
            <h2>Game Features:</h2>
            <ul style={{ paddingLeft: '20px' }}>
              <li>🕹️ <strong>Single Player Mode:</strong> Train your brain and improve your word game skills.</li>
              <li>👥 <strong>Local Multiplayer:</strong> Challenge friends and family on the same device.</li>
              <li>🌍 <strong>Online Multiplayer:</strong> Create private rooms and play remotely with anyone.</li>
              <li>🎡 <strong>Wheel:</strong> Earn points but beware of hidden traps that could make you lose everything!</li>
              <li>⚡ <strong>Power-ups:</strong> Unlock strategic power-ups to gain an edge over your opponents!</li>
              <li>🔄 <strong>Mid-Game Surprise:</strong> At mid-game, a vertical reel shakes up the game with multipliers, point resets, or phrase changes. Anything can happen!</li>
            </ul>
            <p>
              Perfect for crossword lovers, puzzle enthusiasts, and party game fans. No download required: play directly in your browser on PC, tablet, or smartphone.
            </p>
          </>
        )}
      </article>
    </div>
  );
}
