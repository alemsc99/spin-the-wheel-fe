import * as React from 'react';
import { useState } from 'react';
import './StartScreen.css';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation, type Lang } from '../../i18n/TranslationProvider';
import { GoogleLogin } from '@react-oauth/google';

import { API_URL, VITE_GOOGLE_CLIENT_ID } from '../../constants/constants';
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

// Decode a Google JWT credential to extract the user's name
function decodeGoogleJwt(credential: string): { name: string; email?: string; picture?: string } | null {
  try {
    const payload = JSON.parse(atob(credential.split('.')[1]));
    return { name: payload.name || payload.email || '', email: payload.email, picture: payload.picture };
  } catch {
    return null;
  }
}

// Steps in order: login → gameMode → playerNames → start
const TOTAL_STEPS = 4;

export default function StartScreen({ onStart }: StartScreenProps): React.ReactElement {
  const { lang, t } = useTranslation();
  const navigate = useNavigate();
  const [isWakingUp, setIsWakingUp] = useState(false);

  const isIt = lang === 'it';
  const loadingPhrases = isIt
    ? [
        'Preparando la ruota...',
        'Caricando i giocatori...',
        'Mescolando le lettere segrete...',
        'Ricaricando i power-up...',
      ]
    : [
        'Preparing the wheel...',
        'Loading players...',
        'Shuffling secret letters...',
        'Recharging power-ups...',
      ];
  const [loadingPhraseIdx, setLoadingPhraseIdx] = useState(0);
  React.useEffect(() => {
    if (!isWakingUp || loadingPhrases.length === 0) return;
    const interval = setInterval(() => {
      setLoadingPhraseIdx((idx) => (idx + 1) % loadingPhrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isWakingUp, loadingPhrases.length]);

  // --- JSON-LD ---
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: isIt ? 'GiraParole' : 'SpinWords',
    description: isIt
      ? 'Gioco di parole e di enigmistica online gratuito. Gira la ruota, usa i powerups e indovina la frase prima degli altri giocatori.'
      : 'Free online word puzzle game. Spin the wheel, use power-ups, and guess the phrase before other players.',
    genre: ['Puzzle', 'Word Game', 'Trivia', 'Enigmistic'],
    url: 'https://spinwords.pages.dev',
    playMode: ['SinglePlayer', 'MultiPlayer'],
    applicationCategory: 'Game',
    gamePlatform: ['Web Browser', 'Desktop', 'Mobile'],
    numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 4 },
    image: 'https://spinwords.pages.dev/og-image-v2.jpg',
    operatingSystem: 'Any',
    inLanguage: ['it', 'en'],
    author: { '@type': 'Person', name: 'SpinWords Team' },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', category: 'free' },
  };

  const metaTitle = isIt
    ? 'GiraParole - Gioco Enigmistico Online Gratis'
    : 'SpinWords -  Online Word Game';
  const metaDescription = isIt
    ? 'Gioca a GiraParole online gratis! Gira la ruota, indovina le consonanti e risolvi la frase misteriosa prima dei tuoi amici.'
    : 'Play SpinWords online for free! Spin the wheel, guess consonants, and solve the mystery phrase before your friends.';

  // ---- CAROUSEL STATE ----
  const [currentStep, setCurrentStep] = useState(0); // 0=login, 1=gameMode, 2=playerNames, 3=start

  // ---- LOGIN STATE ----
  const [currentUser, setCurrentUser] = useState<{ name: string; isGoogle: boolean } | null>(null);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [loginError, setLoginError] = useState('');
  const googleClientId = VITE_GOOGLE_CLIENT_ID || '';

  // ---- GAME CONFIG STATE ----
  const [gameMode, setGameMode] = useState<GameMode>('single');
  const [onlineSubMode, setOnlineSubMode] = useState<OnlineSubMode>('create');
  const [players, setPlayers] = useState(MIN_PLAYERS);
  const [otherNames, setOtherNames] = useState<string[]>([]); // names of OTHER players (not the current user)
  const [roomCode, setRoomCode] = useState('');
  const [category, setCategory] = useState<'random' | 'food' | 'travel' | 'sports' | 'music' | 'technology'>('random');
  const [error, setError] = useState('');

  // ---- NAVIGATION ----
  function navigateTo(step: number) {
    setCurrentStep(step);
  }

  function goNext() {
    // Validate current step before advancing
    if (currentStep === 0) {
      // Login step: user must have a name
      if (!currentUser) {
        setLoginError(t('error.emptyUsername'));
        return;
      }
      setLoginError('');
      navigateTo(1);
    } else if (currentStep === 1) {
      // Game mode step
      setError('');
      if (gameMode === 'single') {
        // Skip player names step for single player
        navigateTo(3);
      } else {
        // Initialize other names based on mode/count
        if (gameMode === 'local') {
          const count = players - 1; // -1 because current user is one player
          setOtherNames(Array(count).fill(''));
        } else if (gameMode === 'online') {
          if (onlineSubMode === 'create') {
            const count = players - 1;
            setOtherNames(Array(count).fill(''));
          } else {
            setOtherNames([]);
          }
        }
        navigateTo(2);
      }
    } else if (currentStep === 2) {
      // Player names step
      if (gameMode === 'local') {
        const empty = otherNames.findIndex((n) => !n.trim());
        if (empty !== -1) {
          setError(t('error.emptyNames'));
          return;
        }
        const allNames = [currentUser?.name || '', ...otherNames];
        const normalized = allNames.map((n) => n.trim().toLowerCase());
        const hasDuplicates = normalized.some((name, idx) => normalized.indexOf(name) !== idx);
        if (hasDuplicates) {
          setError(t('error.duplicateNames'));
          return;
        }
      }
      setError('');
      navigateTo(3);
    }
  }

  function goBack() {
    if (currentStep === 1) {
      navigateTo(0);
    } else if (currentStep === 2) {
      navigateTo(1);
    } else if (currentStep === 3) {
      if (gameMode === 'single') {
        navigateTo(1);
      } else {
        navigateTo(2);
      }
    }
  }

  // ---- GAME MODE HANDLER ----
  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    setError('');
    if (mode === 'single') {
      setPlayers(1);
      setOtherNames([]);
    } else if (mode === 'local') {
      setPlayers(2);
      setOtherNames(['']);
    } else if (mode === 'online') {
      setOnlineSubMode('create');
      setPlayers(2);
      setOtherNames(['']);
    }
  };

  const handleOnlineSubModeChange = (subMode: OnlineSubMode) => {
    setGameMode('online');
    setOnlineSubMode(subMode);
    setError('');
    if (subMode === 'create') {
      setPlayers(2);
      setOtherNames(['']);
    } else {
      setPlayers(1);
      setOtherNames([]);
    }
  };

  const handlePlayersCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const n = Number(e.target.value);
    setPlayers(n);
    setError('');
    if (gameMode === 'local') {
      const otherCount = n - 1;
      setOtherNames(Array(otherCount).fill(''));
    } else if (gameMode === 'online' && onlineSubMode === 'create') {
      const otherCount = n - 1;
      setOtherNames(Array(otherCount).fill(''));
    }
  };

  const handleOtherNameChange = (idx: number, value: string) => {
    setOtherNames((prev) => {
      const arr = [...prev];
      arr[idx] = value;
      return arr;
    });
    setError('');
  };

  // ---- START GAME ----
  const handleStart = async () => {
    const myName = currentUser?.name || t('players.defaultName');

    let finalPlayers = players;
    let finalNames: string[] = [];
    let finalRoomCode: string | undefined;
    let finalOnlineSubMode: OnlineSubMode | undefined;

    if (gameMode === 'single') {
      finalPlayers = 1;
      finalNames = [myName];
    } else if (gameMode === 'local') {
      finalNames = [myName, ...otherNames];
      finalPlayers = finalNames.length;
    } else if (gameMode === 'online') {
      finalOnlineSubMode = onlineSubMode;
      if (onlineSubMode === 'join') {
        if (!roomCode.trim()) {
          setError(t('error.emptyRoomCode') || 'Enter a room code');
          return;
        }
        finalRoomCode = roomCode;
        finalNames = [myName];
        finalPlayers = 1;
      } else {
        finalNames = [myName];
        finalPlayers = players;
      }
    }
    await onStart({
      players: finalPlayers,
      names: finalNames,
      mode: gameMode,
      onlineSubMode: finalOnlineSubMode,
      roomCode: finalRoomCode,
      category,
    });
  };

  const isJoin = gameMode === 'online' && onlineSubMode === 'join';

  const rulesLabel = t('start.rules');

  // Step labels for progress indicator
  const stepLabels = [
    t('start.step.login'),
    t('start.step.mode'),
    t('start.step.players'),
    t('start.step.start'),
  ];

  // ---- RENDER ----
  return (
    <div className="start-screen pretty-bg">
      {isWakingUp && (
        <div className="loading-overlay">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: '24px' }}>
              <LoadingSpinner />
            </div>
            {loadingPhrases.length > 0 && (
              <div className="loading-text">{loadingPhrases[loadingPhraseIdx]}</div>
            )}
          </div>
        </div>
      )}

      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <script type="application/ld+json">{`\n            ${JSON.stringify(schemaData)}\n          `}</script>
      </Helmet>

      {/* Decorative SVGs */}
      <svg className="bg-decor bg-star star1" viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" fill="#ffd700"/></svg>
      <svg className="bg-decor bg-star star2" viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" fill="#ffd700"/></svg>
      <svg className="bg-decor bg-star star5" viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" fill="#ffd700"/></svg>
      <div className="bg-decor bg-circle c1"></div>
      <div className="bg-decor bg-circle c2"></div>
      <div className="bg-decor bg-circle c3"></div>
      <div className="bg-decor bg-circle c4"></div>
      <div className="bg-decor bg-circle c5"></div>

      <div className="start-card start-card-relative">
        {/* Rules button */}
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

        <h1 className="title fancy-title">{isIt ? 'GiraParole' : 'SpinWords'}</h1>

        {/* Step progress indicator */}
        <div className="carousel-steps">
          {stepLabels.map((label, idx) => {
            // For single player mode, step 2 (playerNames) is skipped visually
            const isSkipped = gameMode === 'single' && idx === 2;
            const isActive = currentStep === idx;
            const isCompleted = currentStep > idx;
            return (
              <div
                key={idx}
                className={`carousel-step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isSkipped ? 'skipped' : ''}`}
              >
                <div className="carousel-step-dot">
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className="carousel-step-label">{label}</span>
              </div>
            );
          })}
        </div>

        {/* Carousel slides */}
        <div className="carousel-viewport">
          <div
            className="carousel-inner"
            style={{ transform: `translateX(-${currentStep * 100}%)`, transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {/* ===== SLIDE 0: LOGIN ===== */}
            <div className="carousel-slide">
              <div className="slide-content login-slide">
                <p className="slide-subtitle">{t('login.subtitle')}</p>

                {currentUser ? (
                  // Already logged in - show who they are
                  <div className="logged-in-state">
                    {currentUser.isGoogle && (
                      <div className="google-avatar">🟢</div>
                    )}
                    <p className="logged-in-label">{t('login.loggedInAs')}</p>
                    <p className="logged-in-name">{currentUser.name}</p>
                    <button
                      className="change-user-btn"
                      onClick={() => {
                        setCurrentUser(null);
                        setShowGuestForm(false);
                        setGuestName('');
                        setLoginError('');
                      }}
                    >
                      ✏️ {isIt ? 'Cambia' : 'Change'}
                    </button>
                  </div>
                ) : showGuestForm ? (
                  // Guest username form
                  <div className="guest-form">
                    <p className="guest-form-title">{t('login.guestTitle')}</p>
                    <input
                      type="text"
                      className="player-name-input pretty-input guest-name-input"
                      placeholder={t('login.guestPlaceholder')}
                      value={guestName}
                      onChange={(e) => {
                        setGuestName(e.target.value);
                        setLoginError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && guestName.trim()) {
                          setCurrentUser({ name: guestName.trim(), isGoogle: false });
                          setLoginError('');
                        }
                      }}
                      autoFocus
                      autoComplete="off"
                      maxLength={30}
                    />
                    {loginError && <div className="error-message">{loginError}</div>}
                    <div className="guest-form-actions">
                      <button
                        className="pretty-btn guest-back-btn"
                        onClick={() => {
                          setShowGuestForm(false);
                          setLoginError('');
                        }}
                      >
                        ← {t('login.guestBack')}
                      </button>
                      <button
                        className="pretty-btn guest-confirm-btn"
                        onClick={() => {
                          if (!guestName.trim()) {
                            setLoginError(t('error.emptyUsername'));
                            return;
                          }
                          setCurrentUser({ name: guestName.trim(), isGoogle: false });
                          setLoginError('');
                        }}
                      >
                        {t('login.guestConfirm')} →
                      </button>
                    </div>
                  </div>
                ) : (
                  // Login options
                  <div className="login-options">
                    {loginError && <div className="error-message">{loginError}</div>}
                    {/* Google Login Button */}
                    {googleClientId ? (
                      <div className="google-login-wrapper">
                        <GoogleLogin
                          onSuccess={(credentialResponse) => {
                            const profile = credentialResponse.credential
                              ? decodeGoogleJwt(credentialResponse.credential)
                              : null;
                            if (profile?.name) {
                              setCurrentUser({ name: profile.name, isGoogle: true });
                              setLoginError('');
                            }
                          }}
                          onError={() => {
                            setLoginError(t('login.googleError'));
                          }}
                          text="signin_with"
                          shape="rectangular"
                          size="large"
                          logo_alignment="left"
                          width="280"
                        />
                      </div>
                    ) : (
                      <button
                        className="pretty-btn google-btn-placeholder"
                        disabled
                        title={t('login.googleNotConfigured')}
                      >
                        <span className="google-icon">G</span>
                        {t('login.googleBtn')}
                      </button>
                    )}

                    <div className="login-divider">
                      <span>{isIt ? 'oppure' : 'or'}</span>
                    </div>

                    {/* Guest button */}
                    <button
                      className="pretty-btn guest-btn"
                      onClick={() => {
                        setShowGuestForm(true);
                        setLoginError('');
                      }}
                    >
                      👤 {t('login.guestBtn')}
                    </button>
                  </div>
                )}
              </div>

              {/* Language toggle on first slide */}
              <div className="lang-toggle login-lang-toggle" role="group" aria-label={t('start.langSelectionAria')}>
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

            {/* ===== SLIDE 1: GAME MODE ===== */}
            <div className="carousel-slide">
              <div className="slide-content">
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
                    onClick={() => handleOnlineSubModeChange('create')}
                  >
                    {t('start.submode.create')}
                  </button>
                  <button
                    className={`mode-btn ${gameMode === 'online' && onlineSubMode === 'join' ? 'active' : ''}`}
                    onClick={() => handleOnlineSubModeChange('join')}
                  >
                    {t('start.submode.join')}
                  </button>
                </div>
              </div>
            </div>

            {/* ===== SLIDE 2: PLAYER NAMES (others only) ===== */}
            <div className="carousel-slide">
              <div className="slide-content">
                {gameMode === 'local' && (
                  <>
                    <div className="players-select pretty-select">
                      <div className="players-select-label-group">
                        <label htmlFor="players" className="players-label">
                          {t('players.label')}
                        </label>
                        <div className="custom-dropdown-wrapper">
                          <select
                            id="players"
                            value={players}
                            onChange={handlePlayersCountChange}
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
                    <p className="others-label">{t('players.othersOnly')}</p>
                    <div className="players-names players-names-grid">
                      {otherNames.map((name, i) => (
                        <input
                          key={i}
                          type="text"
                          className="player-name-input pretty-input"
                          placeholder={`${t('player.placeholder')} ${i + 2}`}
                          value={name}
                          onChange={(e) => handleOtherNameChange(i, e.target.value)}
                          autoComplete="off"
                        />
                      ))}
                    </div>
                  </>
                )}

                {gameMode === 'online' && onlineSubMode === 'create' && (
                  <div className="players-select pretty-select">
                    <div className="players-select-label-group">
                      <label htmlFor="players" className="players-label">
                        {t('players.label')}
                      </label>
                      <div className="custom-dropdown-wrapper">
                        <select
                          id="players"
                          value={players}
                          onChange={handlePlayersCountChange}
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

                {gameMode === 'online' && onlineSubMode === 'join' && (
                  <div className="players-names">
                    <input
                      type="text"
                      className="player-name-input pretty-input"
                      placeholder={t('start.roomCode.placeholder')}
                      value={roomCode}
                      onChange={(e) => { setRoomCode(e.target.value); setError(''); }}
                      autoComplete="off"
                    />
                  </div>
                )}

                {error && <div className="error-message">{error}</div>}
              </div>
            </div>

            {/* ===== SLIDE 3: CATEGORY / START ===== */}
            <div className="carousel-slide">
              <div className="slide-content start-slide">
                <div className="start-summary">
                  {gameMode === 'single' && (
                    <p className="summary-text">
                      {t('start.confirm.single').replace('{name}', currentUser?.name || '')}
                    </p>
                  )}
                  {gameMode === 'local' && (
                    <>
                      <p className="summary-text">{t('start.confirm.local')}</p>
                      <ul className="players-summary-list">
                        {[currentUser?.name || '', ...otherNames].map((name, i) => (
                          <li key={i}>
                            <span className="player-summary-badge">{name || `${t('player.placeholder')} ${i + 1}`}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {gameMode === 'online' && onlineSubMode === 'create' && (
                    <p className="summary-text">{t('start.confirm.online.create')}</p>
                  )}
                  {gameMode === 'online' && onlineSubMode === 'join' && (
                    <p className="summary-text">{t('start.confirm.online.join')}</p>
                  )}
                </div>

                {/* Category selection for single / local modes */}
                {(gameMode === 'single' || gameMode === 'local') && (
                  <div className="category-selection">
                    <p className="category-label">{t('category.label')}</p>
                    <div className="category-buttons">
                      {(['random', 'food', 'travel', 'sports', 'music', 'technology'] as const).map((cat) => (
                        <button
                          key={cat}
                          className={`mode-btn category-btn ${category === cat ? 'active' : ''}`}
                          onClick={() => setCategory(cat)}
                        >
                          {t(`category.${cat}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {error && <div className="error-message">{error}</div>}

                <button className="start-btn pretty-btn" onClick={handleStart}>
                  {gameMode === 'online'
                    ? onlineSubMode === 'create'
                      ? t('start.button.create')
                      : t('start.button.join')
                    : t('start.button')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="carousel-nav">
          {currentStep > 0 && (
            <button className="nav-btn back-btn pretty-btn" onClick={goBack}>
              ← {t('start.back')}
            </button>
          )}
          {currentStep < TOTAL_STEPS - 1 && (
            <button
              className={`nav-btn next-btn pretty-btn ${currentStep === 0 && !currentUser ? 'disabled-look' : ''}`}
              onClick={goNext}
            >
              {t('start.next')} →
            </button>
          )}
        </div>
      </div>

      {/* SEO Content */}
      <article
        className="seo-content-container"
        style={{
          maxWidth: '800px',
          margin: '40px auto',
          padding: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '15px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          color: '#333',
          lineHeight: '1.6',
          fontSize: '1rem',
          textAlign: 'left',
        }}
      >
        {isIt ? (
          <>
            <h2 style={{ color: '#d91b5c', marginTop: 0 }}>Il più divertente dei giochi da fare con gli amici</h2>
            <p>
              GiraParole è un <strong>gioco enigmistico gratuito</strong> perfetto per gli appassionati dei giochi di parole.
              Gira la ruota, chiama le consonanti, compra le vocali e risolvi la frase misteriosa prima dei tuoi avversari!
            </p>
            <h4 style={{ color: '#d91b5c', marginTop: 0 }}>Caratteristiche del gioco:</h4>
            <ul style={{ paddingLeft: '20px' }}>
              <li>🕹️ <strong>Modalità Single Player:</strong> Allenati per migliorare le tue abilità di nei <strong>giochi enigmistici</strong>.</li>
              <li>👥 <strong>Multiplayer Locale:</strong> Sfida amici e parenti sullo stesso dispositivo.</li>
              <li>🌍 <strong>Multiplayer Online:</strong> Crea stanze private e gioca a distanza con chiunque.</li>
              <li>🎡 <strong>Ruota:</strong> guadagna punti ma fai attenzione alle insidie nascoste, potresti perdere tutto!</li>
              <li>⚡ <strong>Potenziamenti:</strong> Sblocca potenziamenti strategici per avere un vantaggio sui tuoi avversari!</li>
              <li>🔄 <strong>Sorpresa di Metà Partita:</strong> A metà gioco, un rullo verticale sconvolge completamente le sorti della partita: moltiplicatori, azzeramento punti o cambio della frase misteriosa. Tutto può cambiare!</li>
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
              Perfect for crossword lovers, puzzle enthusiasts, and party game fans. No download required: play directly in your browser on PC, tablet or smartphone.
            </p>
          </>
        )}
      </article>
    </div>
  );
}
