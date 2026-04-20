import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import GameInfo from './components/game_info/GameInfo.jsx';
import LettersGrid from './components/letters_grid/LettersGrid.jsx';
import GameActions from './components/game_actions/GameActions.jsx';
import GameCenter from './components/game_center/GameCenter.jsx';
import { ErrorOverlay } from './components/overlays/Overlays.jsx';
import StartScreenWrapper from './components/start_screen/StartScreenWrapper.tsx';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './index.css';
import "./components/letters_grid/LettersGrid.css";
import { useTranslation, type Lang } from './i18n/TranslationProvider';
import TurnOverlay from './components/overlays/TurnOverlay.tsx';
import Powerups from './components/powerups/Powerups.jsx';
import Leaderboard from './components/leaderboard/Leaderboard';
import Lobby from './components/lobby/Lobby.jsx';
import { CreateRoomResponse, GuessPhraseResp, GuessResp, NewGameResp, ReelSpinResponse, SpinResp } from './types/api.ts';
import { debugLog } from './utils/utils.ts';
import { API_URL } from './constants/constants.jsx';
import useScoreManager from './hooks/ScoreManager.ts';
import HalfGameReel from './components/half_game_reel/HalfGameReel.jsx';
import RulesPage from './components/rules/RulesPage';
import ScoreboardPage from './components/scoreboard/ScoreboardPage.tsx';
import ShieldOverlay from './components/overlays/ShieldOverlay.tsx';
import DoubleOverlay from './components/overlays/DoubleOverlay.tsx';
import LoseItAllOverlay from './components/overlays/LoseItAllOverlay.tsx';
import SkipOverlay from './components/overlays/SkipOverlay.tsx';
import WrongLetterOverlay from './components/overlays/WrongLetterOverlay.tsx';
import WheelNextOverlay from './components/overlays/WheelNextOverlay.tsx';
import WheelBankruptOverlay from './components/overlays/WheelBankruptOverlay.tsx';
import SwapOverlay from './components/overlays/SwapOverlay.tsx';
import BoughtVowelOverlay from './components/overlays/BoughtVowelOverlay.tsx';
import GuessPhraseIncorrectOverlay from './components/overlays/GuessPhraseIncorrectOverlay.tsx';
import ReelOverlay from './components/overlays/ReelOverlay.tsx';
import { Helmet } from 'react-helmet-async';


const SUPPORTED_LANGS: Lang[] = ['it', 'en'];
const LEGACY_ROUTES = new Set<string>(['game', 'rules', 'scoreboard']);
function AppContent() {
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [playerScores, setPlayerScores] = useState<Record<string, number>>({});
  const [firstPlayerIdx, setFirstPlayerIdx] = useState<number|null>(null);
  // Overlays 
  const [currentOverlayPlayerName, setCurrentOverlayPlayerName] = useState<string>('');
  const [showTurnOverlay, setShowTurnOverlay] = useState(false);
  const [turnOverlayMsg, setTurnOverlayMsg] = useState('');
  const [showShieldOverlay, setShowShieldOverlay] = useState(false);
  const [shieldOverlayMsg, setShieldOverlayMsg] = useState('');
  const [showDoubleOverlay, setShowDoubleOverlay] = useState(false);
  const [doubleOverlayMsg, setDoubleOverlayMsg] = useState('');
  const [showLoseItAllOverlay, setShowLoseItAllOverlay] = useState(false);
  const [loseItAllOverlayMsg, setLoseItAllOverlayMsg] = useState('');
  const [showSkipOverlay, setShowSkipOverlay] = useState(false);
  const [skipOverlayMsg, setSkipOverlayMsg] = useState('');
  const [turnOverlayIsError, setTurnOverlayIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showWrongLetterOverlay, setShowWrongLetterOverlay] = useState(false);
  const [wrongLetterOverlayMsg, setWrongLetterOverlayMsg] = useState("");
  const [showWheelBankruptOverlay, setShowWheelBankruptOverlay] = useState(false);
  const [wheelBankruptOverlayMsg, setWheelBankruptOverlayMsg] = useState("");
  const [showWheelNextOverlay, setShowWheelNextOverlay] = useState(false);
  const [wheelNextOverlayMsg, setWheelNextOverlayMsg] = useState("");
  const [showSwapOverlay, setShowSwapOverlay] = useState(false);
  const [wheelSwapOverlayMsg, setWheelSwapOverlayMsg] = useState("");
  const [showBoughtVowelOverlay, setShowBoughtVowelOverlay] = useState(false);
  const [boughtVowelOverlayMsg, setBoughtVowelOverlayMsg] = useState("");
  const [showGuessPhraseIncorrectOverlay, setShowGuessPhraseIncorrectOverlay] = useState(false);
  const [guessPhraseIncorrectOverlayMsg, setGuessPhraseIncorrectOverlayMsg] = useState("");
  const [reelOverlayMsg, setReelOverlayMsg] = useState("");
  const [showReelOverlay, setShowReelOverlay] = useState(false);

  const { t, lang, setLang } = useTranslation();
  const [canBuyVowel, setCanBuyVowel] = useState(false);
  const [wrongLetters, setWrongLetters] = useState({} as Record<string, boolean>);
  const [gameId, setGameId] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [masked, setMasked] = useState('');
  const [score, setScore] = useState(0);
  const [scoreIncrement, setScoreIncrement] = useState(0);
  const [showScoreAnim, setShowScoreAnim] = useState(false);
  const [scoreDecrement, setScoreDecrement] = useState(0);
  const [showScoreDecAnim, setShowScoreDecAnim] = useState(false);
  const [lastSpin, setLastSpin] = useState<string | number>(0);
  const [usedLetters, setUsedLetters] = useState<Record<string, boolean>>({});
  const [guessInput, setGuessInput] = useState('');
  const [terminatedVowels, setTerminatedVowels] = useState(false);
  const [victory, setVictory] = useState(false);
  const [defeat, setDefeat] = useState(false);
  const [canGuess, setCanGuess] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showPhraseInput, setShowPhraseInput] = useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [powerups, setPowerups] = useState<Record<string, string[]>>({});
  const [scoreChanges, setScoreChanges] = useState<Record<string, number>>({});
  const prevPlayerScores = useRef<Record<string, number>>({});
  const [pendingSpinData, setPendingSpinData] = useState<any>(null);
  const [myName, setMyName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string>("");
  const [roomHost, setRoomHost] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
 
  const socketRef = useRef<WebSocket | null>(null);

  // 2. Funzione per collegarsi (la chiamerai dalla Lobby o dallo Start)
  const connectWebSocket = useCallback((roomCode: string, playerName: string, userId: string | null) => {
    setMyName(playerName);
    setUserId(userId);
    setRoomCode(roomCode);
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      console.log("WebSocket connection already active/pending.");
      return;
    }

    // Pulisce eventuale socket precedente chiuso male
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    const wsBase = API_URL.replace(/\/$/, "").replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsBase}/ws`);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        action: "join",
        room_code: roomCode,
        player: playerName,
        user_id: userId
      }));
    };

    ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      const payload = data.payload;
      // GESTIONE DEI MESSAGGI DAL BACKEND
      switch (data.event) { 
        case 'ROOM_STATE':
          setPlayerNames(payload.player_names);
          break;
        case 'PLAYER_LEFT':
          console.log("Received PLAYER_LEFT via WebSocket: ", payload);
          if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
          }
          if (payload.player === playerName) {
            setTurnOverlayIsError(true);
            setShowTurnOverlay(true);
            setTurnOverlayMsg(t('lobby.youLeft'));            
            break;
          }
          setTurnOverlayIsError(true);
          setShowTurnOverlay(true);
          setTurnOverlayMsg(`${payload.player}` + t('lobby.playerLeft'));          
          break;

        case 'PLAYER_JOINED':
          console.log("Received PLAYER_JOINED via WebSocket");
          setPlayerNames(payload.players);
          break;

        case 'NEW_GAME':
          console.log("Received NEW_GAME via WebSocket");
          // Reset score tracking to avoid "deduction" animations when resetting scores
          setScoreChanges({});
          setTerminatedVowels(false);

          // Accept and apply server-provided authoritative state fields when present.
          setGameId(payload.game_id ?? null)
          if (typeof payload.topic === 'string') setTopic(payload.topic)
          if (typeof payload.masked === 'string') setMasked(payload.masked)
          if (payload.powerups) setPowerups(payload.powerups);
          setPlayerNames(payload.player_names);
          setNumPlayers(payload.player_names.length);
          setFirstPlayerIdx(payload.current_player_idx ?? 0);
          setPlayerScores(payload.player_scores ?? {});
          setLastSpin(payload.last_spin !== undefined ? payload.last_spin : 0)
          setUsedLetters(payload.used_letters ?? {})
          setGuessInput('')
          setVictory(!!payload.complete)
          setDefeat(false)
          setCanGuess(false)
          setCanBuyVowel(false)
          setIsSpinning(false)
          setShowPhraseInput(false)
          setWrongLetters({})
          navigate(`/${lang}/game`);
          break;

        case 'START_GAME':
          console.log("Received START_GAME via WebSocket");
          // 1. Salviamo TUTTI i dati della partita nello stato di App.tsx
          setGameId(data.game_id);
          setTopic(payload.topic);
          setMasked(payload.masked);
          setPlayerNames(payload.player_names);
          setNumPlayers(payload.player_names.length);
          setPlayerScores(payload.player_scores);
          setFirstPlayerIdx(payload.current_player_idx);
          setIsSpinning(false);   
          setCanGuess(false);      
          setLastSpin(""); 
          setTerminatedVowels(false);

          setTurnOverlayMsg(t('newGame.firstTurn')+ payload.player_names[payload.current_player_idx || 0]);
          setShowTurnOverlay(true);

          navigate(`/${lang}/game`);
          break;

        case "START_SPIN":
          console.log("Received START_SPIN via WebSocket");
          // 1. RESETTA lastSpin a null ogni volta che inizia un nuovo giro
          setLastSpin(""); 
          
          // 2. Resetta anche i dati pendenti
          setPendingSpinData(null);
          
          setFirstPlayerIdx(payload.current_player_idx);
          setMasked(payload.masked);

          setIsSpinning(true); 
          break;

        case "END_SPIN":
          console.log("Received END_SPIN via WebSocket");
          switch (payload.value) {
            case 'Bancarotta':
              if (payload.used_shields.includes(payload.previous_player)){
                if (payload.player_names[payload.current_player_idx] === playerName){
                  setWheelBankruptOverlayMsg(payload.used_shields[0] + ' ' +t('overlay.WheelBankruptShieldedNextIsYou'));
                }else{
                  setWheelBankruptOverlayMsg(payload.used_shields[0] + ' ' +t('overlay.WheelBankruptShielded'));
                }
              }else{
                if (payload.player_names[payload.current_player_idx] === playerName){
                  setWheelBankruptOverlayMsg(payload.previous_player + ' ' + t('overlay.WheelBankruptNextIsYou'));
                }else{
                  setWheelBankruptOverlayMsg(payload.previous_player + ' ' + t('overlay.WheelBankrupt'));
                }
              }
              break;
            case "Passa":
              if (payload.used_shields.includes(payload.previous_player)){
                setWheelNextOverlayMsg(payload.used_shields[0] + ' ' +t('overlay.WheelNextShielded'));
              }else{
                if (payload.player_names[payload.current_player_idx] === playerName){
                  setWheelNextOverlayMsg(payload.previous_player + ' ' + t('overlay.WheelNextIsYou'));
                }else{
                  setWheelNextOverlayMsg(payload.previous_player + ' ' + t('overlay.WheelNext'));
                }
              }
              break;
            case 'Scambia':
              if (payload.swapped_player === playerName){
                setWheelSwapOverlayMsg(t('overlay.YouSwapTarget') + ' ' + payload.previous_player);
              }else{
                setWheelSwapOverlayMsg(payload.previous_player + ' ' + t('overlay.OthersSwapTargetFirstPart') + ' ' + payload.swapped_player + ' ' + t('overlay.OthersSwapTargetSecondPart'));
              }
              break;
          }
          setLastSpin(payload.value); 
          setPendingSpinData(payload); 
          setIsSpinning(false); 
          break;
        case "BUY_VOWEL":
          console.log("Received BUY_VOWEL via WebSocket");
          setUsedLetters(payload.used_letters);
          setPlayerScores(payload.player_scores);
          setFirstPlayerIdx(payload.current_player_idx);
          setMasked(payload.masked);
          if (payload.player_names.includes(payload.buyer)){
            if (payload.occurrences === 0) {
              setBoughtVowelOverlayMsg(payload.buyer + ' ' + t('overlay.BoughtVowelNoOccurrences'));
            }else{
              setBoughtVowelOverlayMsg(payload.buyer + ' ' + t('overlay.BoughtVowel'));
            }
            setShowBoughtVowelOverlay(true);
          }
          if (payload.boughtVowels > 0 && payload.boughtVowels % 5 === 0){
            setTerminatedVowels(true);
          }else{
            setTerminatedVowels(false);
          }
          break;

        case "GUESS_LETTER":
          console.log("Received GUESS_LETTER via WebSocket");
          setMasked(payload.masked);
          setPowerups(payload.powerups);
          setFirstPlayerIdx(payload.current_player_idx);
          setScoreIncrement(payload.added_score);
          setShowScoreAnim(true);
          setTimeout(() => setShowScoreAnim(false), 1200);
          if (payload.used_letters) setUsedLetters(payload.used_letters);
          setCanGuess(false);
          setPlayerScores(payload.player_scores);
          if (payload.used_shields.length > 0){
            setWrongLetterOverlayMsg(payload.used_shields[0] + ' ' + t('overlay.WrongLetterShielded'));
            setShowWrongLetterOverlay(true);
          }else if (payload.used_shields.length === 0 && payload.added_score === 0){
            if (payload.player_names[payload.current_player_idx] === playerName){
              setWrongLetterOverlayMsg(payload.previous_player + ' ' + t('overlay.OtherWrongLetterYourTurn'));
            }else{  
              setWrongLetterOverlayMsg(payload.previous_player + ' ' + t('overlay.OtherWrongLetterNotYourTurn')+ ' ' + payload.player_names[payload.current_player_idx]);
            }
            setShowWrongLetterOverlay(true);
          }
          break;
        
        case "USE_POWERUP":
          console.log("Received USE_POWERUP via WebSocket");
          setPlayerScores(payload.player_scores);
          setPowerups(payload.powerups);
          setFirstPlayerIdx(payload.current_player_idx);
          if (payload.target_player){
            // Lose it all and skip
            if (payload.used_powerup === 'Lose'){
              if (payload.target_player === playerName){
                if (payload.used_shields.includes(playerName)){
                  setLoseItAllOverlayMsg(payload.buyer_player +' '+ t('overlay.LoseItAllPowerupShielded'));
                }else{
                  setLoseItAllOverlayMsg(payload.buyer_player +' '+ t('overlay.LoseItAllPowerupForYou'));
                }
              }else{
                if (payload.used_shields.length > 0){
                  setLoseItAllOverlayMsg(payload.buyer_player +' '+ t('overlay.LoseItAllPowerupFirstPartShielded') + payload.target_player +' '+ t('overlay.LoseItAllPowerupSecondPartShielded'));
                }else{
                  setLoseItAllOverlayMsg(payload.buyer_player +' '+ t('overlay.LoseItAllPowerupFirstPart') + payload.target_player +' '+ t('overlay.LoseItAllPowerupSecondPart'));
                }
              }
              setShowLoseItAllOverlay(true);
            }else if (payload.used_powerup === 'Skip'){
              if (payload.target_player === playerName){
                if (payload.used_shields.includes(playerName)){
                  setSkipOverlayMsg(payload.buyer_player +' '+ t('overlay.SkipPowerupShielded'));
                }else{
                  setSkipOverlayMsg(payload.buyer_player +' '+ t('overlay.SkipPowerupForYou'));
                }
              }else{
                if (payload.used_shields.length > 0){
                  setSkipOverlayMsg(payload.buyer_player +' '+ t('overlay.SkipPowerupFirstPartShielded') + payload.target_player +' '+ t('overlay.SkipPowerupSecondPartShielded'));
                }else{
                  setSkipOverlayMsg(payload.buyer_player +' '+ t('overlay.SkipPowerupFirstPart') + payload.target_player +' '+ t('overlay.SkipPowerupSecondPart'));
                }
              }
              setShowSkipOverlay(true);
            }
          }else{
            // Double and Shield
            if (payload.used_powerup === "Double"){
              setDoubleOverlayMsg(payload.buyer_player +' '+ t('overlay.DoublePowerup'));
              setShowDoubleOverlay(true);
            }else if (payload.used_powerup === "Shield"){
              setShieldOverlayMsg(payload.buyer_player +' '+ t('overlay.ShieldPowerup'));
              setShowShieldOverlay(true);
            }
          }
          break;
        
        case "GUESS_PHRASE":
          console.log("Received GUESS_PHRASE via WebSocket");
          setMasked(payload.masked);
          setVictory(payload.complete);
          setPlayerScores(payload.player_scores);
          setFirstPlayerIdx(payload.current_player_idx);
          if (payload.success === false){
            setGuessPhraseIncorrectOverlayMsg(payload.who_guessed + ' ' + t('overlay.WrongPhrase'));
            setShowGuessPhraseIncorrectOverlay(true);
          }
          break;

        case "REEL_SPIN":
          console.log("Received REEL_SPIN via WebSocket");
          // Only store result; apply effects when reel animation ends
          setReelResult(payload.value);
          setPendingReelPayload(payload);
          setShowReel(true);
          switch (payload.value) {
            case 'x0.5':
              setReelOverlayMsg(t('overlay.ReelX0.5'));
              break;
            case 'x2':
              setReelOverlayMsg(t('overlay.ReelX2'));
              break;
            case 'x5':
              setReelOverlayMsg(t('overlay.ReelX5'));
              break;
            case 'Evil':
              setReelOverlayMsg(t('overlay.ReelEvil'));
              break;
            case 'New_Phrase':
              setReelOverlayMsg(t('overlay.ReelNewPhrase'));
              setTerminatedVowels(false);
              break;
          }
          break;
      }
    };

    socketRef.current = ws;
  }, [lang, navigate, t]);

  useEffect(() => {
    const changes: Record<string, number> = {};
    let hasChanges = false;
    
    // Compare current scores with previous scores
    for (const name in playerScores) {
      if (prevPlayerScores.current[name] !== undefined) {
        const oldVal = prevPlayerScores.current[name];
        const newVal = playerScores[name];
        if (newVal !== oldVal) {
          const diff = newVal - oldVal;
          if (diff !== 0) {
             changes[name] = diff;
             hasChanges = true;
          }
        }
      }
    }

    if (hasChanges) {
      setScoreChanges(prev => ({ ...prev, ...changes }));
      // Clear changes after animation duration
      setTimeout(() => {
        setScoreChanges(prev => {
          const next = { ...prev };
          for (const key in changes) {
             // Only delete if it matches the current change (simple debounce)
             // or just delete it.
             delete next[key];
          }
          return next;
        });
      }, 2000);
    }

    prevPlayerScores.current = playerScores;
  }, [playerScores]);

  const scoreManager = useScoreManager({ API_URL, gameId, playerNames, firstPlayerIdx, setPlayerScores, setScore });
  const { incrementPlayerScore, setPlayerScoreAbsolute } = scoreManager;
  const [showReel, setShowReel] = useState(false);
  const [reelResult, setReelResult] = useState<string | null>(null);
  const [pendingShowReel, setPendingShowReel] = useState(false);
  const [pendingReelPayload, setPendingReelPayload] = useState<ReelSpinResponse | null>(null);

  const pathname = location.pathname;
  const pathSegments = useMemo(() => pathname.split('/').filter(Boolean), [pathname]);
  const pathLangCandidate = pathSegments[0];
  const restSegments = useMemo(() => {
    if (pathSegments.length === 0) {
      return [] as string[];
    }
    const candidate = pathSegments[0];
    if (!candidate) {
      return [] as string[];
    }
    if (!SUPPORTED_LANGS.includes(candidate as Lang)) {
      if (pathSegments.length === 1 && LEGACY_ROUTES.has(candidate)) {
        return [candidate];
      }
      return pathSegments.slice(1);
    }
    return pathSegments.slice(1);
  }, [pathSegments]);
  const pathLangAsLang = pathLangCandidate as Lang | undefined;
  const restPath = restSegments.join('/');
  const restPathWithSlash = restPath ? `/${restPath}` : '';

  useEffect(() => {
    if (!pathLangCandidate) {
      const target = `/${lang}${restPathWithSlash}`;
      if (pathname !== target) {
        navigate(target, { replace: true });
      }
      return;
    }

    if (!SUPPORTED_LANGS.includes(pathLangCandidate as Lang)) {
      const target = `/${lang}${restPathWithSlash}`;
      if (pathname !== target) {
        navigate(target, { replace: true });
      }
      return;
    }

    if (pathLangCandidate !== lang) {
      setLang(pathLangCandidate as Lang);
    }
  }, [lang, navigate, pathLangCandidate, pathname, restPathWithSlash, setLang]);

  // Mostra il reel, chiama il backend e chiudi l'overlay in automatico
  useEffect(() => {
    if (pendingShowReel) {
      setIsSpinning(true);
      let timer = setTimeout(() => {
        setShowReel(true);
        fetchReelResult();
        setPendingShowReel(false);
      }, 1000); 
      setIsSpinning(false);
      return () => clearTimeout(timer);
    }
  }, [pendingShowReel]);

  useEffect(() => {
    if (showTurnOverlay) {
      const timer = setTimeout(() => {
        setShowTurnOverlay(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showTurnOverlay]);

  useEffect(() => {
    if (showShieldOverlay) {
      const timer = setTimeout(() => {
        setShowShieldOverlay(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showShieldOverlay]);

  useEffect(() => {
    if (showDoubleOverlay) {
      const timer = setTimeout(() => {
        setShowDoubleOverlay(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showDoubleOverlay]);

  useEffect(() => {
    if (showLoseItAllOverlay) {
      const timer = setTimeout(() => {
        setShowLoseItAllOverlay(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showLoseItAllOverlay]);

  useEffect(() => {
    if (showSkipOverlay) {
      const timer = setTimeout(() => {
        setShowSkipOverlay(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSkipOverlay]);

  useEffect(() => {
    if (showWrongLetterOverlay) {
      const timer = setTimeout(() => {
        setShowWrongLetterOverlay(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showWrongLetterOverlay]);

  useEffect(() => {
    if (showWheelBankruptOverlay) {
      const timer = setTimeout(() => {
        setShowWheelBankruptOverlay(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showWheelBankruptOverlay]);

  useEffect(() => {
    if (showWheelNextOverlay) {
      const timer = setTimeout(() => {
        setShowWheelNextOverlay(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showWheelNextOverlay]);

  useEffect(() => {
    if (showSwapOverlay) {
      const timer = setTimeout(() => {
        setShowSwapOverlay(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSwapOverlay]);

  useEffect(() => {
    if (showBoughtVowelOverlay) {
      const timer = setTimeout(() => {
        setShowBoughtVowelOverlay(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showBoughtVowelOverlay]);

  useEffect(() => {
    if (showGuessPhraseIncorrectOverlay) {
      const timer = setTimeout(() => {
        setShowGuessPhraseIncorrectOverlay(false);
      }
      , 3000);
      return () => clearTimeout(timer);
    }
  }, [showGuessPhraseIncorrectOverlay]);

  useEffect(() => {
    if (showReelOverlay) {
      const timer = setTimeout(() => {
        setShowReelOverlay(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showReelOverlay]);

  useEffect(() => {
    // Only auto-set the overlay name when the overlay is for a normal "change turn" event.
    // This prevents overwriting custom messages (e.g. swap) that set a different name.
    if (showTurnOverlay && firstPlayerIdx !== null && playerNames.length > 0 && turnOverlayMsg === 'overlay.changeTurn') {
      setCurrentOverlayPlayerName(playerNames[firstPlayerIdx] || '');
    }
  }, [firstPlayerIdx, showTurnOverlay, playerNames, turnOverlayMsg]);

  // Keep the displayed `score` synced with the active player's stored score
  useEffect(() => {
    if (firstPlayerIdx !== null && playerNames.length > 0) {
      const player = playerNames[firstPlayerIdx];
      setScore(playerScores[player] ?? 0);
    }
  }, [firstPlayerIdx, playerScores, playerNames]);

  // Automatically close ErrorOverlay after 2 seconds
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        setErrorMsg("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  function showErrorMessage(message: string) {
    setErrorMsg(message);
  }

  async function newGame(players: number, names: string[], category?: string, userId?: string){
    if (userId) {
      setUserId(userId);
    }
    try{
      const res = await fetch(`${API_URL}/new-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          num_players: players,
          player_names: names,
          language: lang,
          room_code: roomCode,
          category: category,
          user_id: userId
        })
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data: NewGameResp = await res.json()
      
      // Reset score tracking to avoid "deduction" animations when resetting scores
      prevPlayerScores.current = {}; 
      setScoreChanges({});

      // Accept and apply server-provided authoritative state fields when present.
      setGameId(data.game_id ?? null)
      if (typeof data.topic === 'string') setTopic(data.topic)
      if (typeof data.masked === 'string') setMasked(data.masked)
      setLastSpin(data.last_spin !== undefined ? data.last_spin : 0)
      setUsedLetters(data.used_letters ?? {})
      setGuessInput('')
      setVictory(false)
      setDefeat(false)
      setCanGuess(false)
      setCanBuyVowel(false)
      setIsSpinning(false)
      setShowPhraseInput(false)
      setWrongLetters({})
      setPowerups({});
      setTerminatedVowels(false);
      if (numPlayers > 1){
        setTurnOverlayMsg(t('newGame.firstTurn')+ data.player_names?.[data.current_player_idx || 0] || '');
      }else if (numPlayers === 1){
        setTurnOverlayMsg(t('newGame.firstTurnSinglePlayer'));
      }
      setShowTurnOverlay(true);

      if (data.player_scores && Object.keys(data.player_scores).length > 0) {
        setPlayerScores(data.player_scores)
        // If server provided current player, set visible score to that player's value
        if (typeof data.current_player_idx === 'number') {
          const currentName = (data.player_names && data.player_names[data.current_player_idx]) || names[data.current_player_idx]
          setScore(data.player_scores[currentName] ?? 0)
        } else {
          setScore(0)
        }
      } else {
        setPlayerScores(Object.fromEntries(names.map(n => [n, 0])))
        setScore(0)
      }

      if (typeof data.current_player_idx === 'number') {
        setFirstPlayerIdx(data.current_player_idx)
      } else {
        setFirstPlayerIdx(0)
      }
    }catch(err){
      console.error(err)
    }
  }

  async function createRoom(players: number, language: string, host_name: string, category?: string, userId?: string) {
    try {
      const res = await fetch(`${API_URL}/create-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host_name: host_name,
          capacity: players,
          language: language,
          category: category,
          host_id: userId
        })
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: CreateRoomResponse = await res.json();
      setPlayerNames(data.players);
      setRoomHost(host_name);
      const targetLang = data.language || language || lang;
      navigate(`/${targetLang}/lobby`, { state: { ...data, my_name: host_name, category, userId } });
    } catch (err) {
      console.error(err);
      showErrorMessage('Failed to create room');
    }
  }

  async function joinRoom(roomCode: string, playerName: string, userId?: string) {
    try {
      const res = await fetch(`${API_URL}/join-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_code: roomCode,
          player_name: playerName,
          user_id: userId
        })
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const targetLang = data.language || lang;
      navigate(`/${targetLang}/lobby`, { state: { ...data, my_name: playerName, userId } });
    } catch (err) {
      console.error(err);
      showErrorMessage('Failed to join room');
    }
  }
  // Fetch the reel result from backend
  async function fetchReelResult() {
    if (!gameId) return;
    try {
      const res = await fetch(`${API_URL}/reel-spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, language: lang })
      });
      const data: ReelSpinResponse = await res.json();
      // Only store result; apply effects when reel animation ends
      setReelResult(data.value);
      switch (data.value) {
        case 'x0.5':
          if (numPlayers === 1) {
            setReelOverlayMsg(t('overlay.ReelX0.5SinglePlayer'));
          } else {
            setReelOverlayMsg(t('overlay.ReelX0.5'));
          }
          break;
        case 'x2':
          if (numPlayers === 1) {
            setReelOverlayMsg(t('overlay.ReelX2SinglePlayer'));
          } else {
            setReelOverlayMsg(t('overlay.ReelX2'));
          }
          break;
        case 'x5':
          if (numPlayers === 1) {
            setReelOverlayMsg(t('overlay.ReelX5SinglePlayer'));
          } else {
            setReelOverlayMsg(t('overlay.ReelX5'));
          }
          break;
        case 'Evil':
          if (numPlayers === 1) {
            setReelOverlayMsg(t('overlay.ReelEvilSinglePlayer'));
          } else {
            setReelOverlayMsg(t('overlay.ReelEvil'));
          }
          break;
        case 'New_Phrase':
          setReelOverlayMsg(t('overlay.ReelNewPhrase'));
          setTerminatedVowels(false);
          break;
      }
      setPendingReelPayload(data);
    } catch (err) {
      setReelResult('error');
    }
  }

  function applyReelResult() {
    if (!pendingReelPayload) return;
    const data = pendingReelPayload;
    setLastSpin(data.last_spin);
    setUsedLetters(data.used_letters);
    setPlayerScores(data.player_scores);
    setTopic(data.topic);
    setMasked(data.masked);
    setPendingReelPayload(null);
    setShowReelOverlay(true);
  }

  function handleReelClose() {
    setShowReel(false);
    applyReelResult();
  }

  async function handleShowRules() {
    navigate(localizedRulesPath);
  }

  async function handleBuyVowel() {
    if (!gameId) return;
    // Ask server to charge the vowel cost and return authoritative state.
    try {
      const res = await fetch(`${API_URL}/buy-vowel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, player_name: myName})
      });
      if (!res.ok) {
        if (res.status == 403){
          showErrorMessage(t('buyVowelNotYourTurn'));
          return;
        }
        const text = await res.text();
        let json: any = {};
        try { json = text ? JSON.parse(text) : {}; } catch (e) { json = {}; }
        showErrorMessage(json.detail || json.error || json.message || t('buyVowel.lowMoney'));
        return;
      }
      const data: any = await res.json();
      console.log("Buy vowel response:", data);
      if (data.boughtVowels > 0 && data.boughtVowels % 5 === 0){
        setTerminatedVowels(true);
      }else{
        setTerminatedVowels(false);
      }
      // Apply authoritative state from server
      if (data.player_scores) {
        setPlayerScores(data.player_scores);
        if (typeof data.current_player_idx === 'number') {
          const currentName = playerNames[data.current_player_idx];
          setScore(data.player_scores[currentName] ?? 0);
        }
      }
      if (data.used_letters) setUsedLetters(data.used_letters);
      if (typeof data.current_player_idx === 'number') setFirstPlayerIdx(data.current_player_idx);
      // Enable vowel selection in the UI only after server confirmed the purchase
      setCanBuyVowel(true);
    } catch (err) {
      console.error(err);
      showErrorMessage(t('buyVowel.lowMoney'));
    }
  }

  // Handler for clicks on powerup buttons (called by <Powerups onUse={...} />)
  // Each case is intentionally left empty for you to implement the desired behavior.
  async function handlePowerupUse(powerup: string, targetPlayer: string | null = null) {
    const currentPlayer = firstPlayerIdx !== null ? playerNames[firstPlayerIdx] : null;

    if (!currentPlayer) {
      showErrorMessage('Nessun giocatore attivo');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/use-powerup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, used_powerup: powerup, target_player: targetPlayer, player_name: myName, user_id: userId })
      });
      if (!res.ok) {
        if (res.status === 409){
          showErrorMessage(t('buyPowerup.cannotUseNow'));
        }else if (res.status == 403){
          showErrorMessage(t('buyPowerupNotYourTurn'));
        }else{
          showErrorMessage(t('buyPowerup.lowMoney'));
        }
        return;
      }
      const data: any = await res.json();
      setScoreDecrement(data.cost);
      setShowScoreDecAnim(true);
      setTimeout(() => setShowScoreDecAnim(false), 1200);
      switch (powerup) {
        case 'Shield':
          setShieldOverlayMsg(t('overlay.YouBoughtShieldPowerup'));
          setShowShieldOverlay(true);
          break;
        case 'Double':
          setDoubleOverlayMsg(t('overlay.YouBoughtDoublePowerup'));
          setShowDoubleOverlay(true);
          break;
        case 'Lose':
          if (data.used_shields.includes(targetPlayer)){
            setLoseItAllOverlayMsg(t('overlay.YouBoughtLoseItAllPowerupShieldedFirstPart') + targetPlayer + t('overlay.YouBoughtLoseItAllPowerupShieldedSecondPart'));
          }else{
            setLoseItAllOverlayMsg(t('overlay.YouBoughtLoseItAllPowerupFirstPart') + targetPlayer + t('overlay.YouBoughtLoseItAllPowerupSecondPart'));
          }
          setShowLoseItAllOverlay(true);
          break;
        case 'Skip':
          if (data.used_shields.includes(targetPlayer)){
            setSkipOverlayMsg(t('overlay.YouBoughtSkipPowerupShieldedFirstPart') + targetPlayer + t('overlay.YouBoughtSkipPowerupShieldedSecondPart'));
          }else{
            setSkipOverlayMsg(t('overlay.YouBoughtSkipPowerupFirstPart') + targetPlayer + t('overlay.YouBoughtSkipPowerupSecondPart'));
          }
          setShowSkipOverlay(true);
          break;
      }

      if (data.player_scores) {
        setPlayerScores(data.player_scores);
      }
      if (data.powerups) {
        setPowerups(data.powerups);
      }
    } catch (err) {
      console.error(err);
    }

  }

  async function handleGuessVowel(vowel: string) {
    if (!gameId) return;
  // Do not rely on client-side usedLetters for validation/security; server will reject already-used vowels.
    // Trigger buy+reveal in a single server request: POST /buy-vowel with letter
    setCanBuyVowel(false);
    try {
      const res = await fetch(`${API_URL}/buy-vowel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, letter: vowel, player_name: myName })
      });
      if (!res.ok) {
        const text = await res.text();
        let json: any = {};
        try { json = text ? JSON.parse(text) : {}; } catch (e) { json = {}; }
        showErrorMessage(json.detail || json.error || json.message || `Server error ${res.status}`);
        return;
      }
      const data: any = await res.json();
      if (data.occurrences === 0) {
        setBoughtVowelOverlayMsg(t('overlay.YouBoughtVowelNoOccurrences'));
        setShowBoughtVowelOverlay(true);
      }

      // Apply server-provided state
      if (typeof data.masked === 'string') setMasked(data.masked);
      if (data.used_letters) setUsedLetters(data.used_letters);
      setWrongLetters(prev => {
        const copy = { ...prev };
        delete copy[vowel];
        return copy;
      });

      // Show vowel purchase animation (debit)
      setScoreDecrement(500);
      setShowScoreDecAnim(true);
      setTimeout(() => setShowScoreDecAnim(false), 1200);

      if (data.player_scores) {
        setPlayerScores(data.player_scores);
        if (typeof data.current_player_idx === 'number') {
          const currentName = playerNames[data.current_player_idx];
          setScore(data.player_scores[currentName] ?? 0);
        }
      }

      if (typeof data.current_player_idx === 'number') {
        setFirstPlayerIdx(data.current_player_idx);
      }
      if (data.complete) setVictory(true);
      if (data.showReel && !showReel) {
        setPendingShowReel(true);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSpin(): Promise<SpinResp | false> {
    // 1. Controlli di guardia (uguali a prima)
    if (!gameId) return false;
    if (isSpinning || canGuess) {
      showErrorMessage(t('wheel.mustSpinFirst'));
      return false;
    }

    // Capiamo se siamo in modalità Online o Locale
    const isOnline = socketRef.current !== null;

    // 2. Se siamo in SINGLE PLAYER, facciamo partire la ruota visivamente SUBITO
    if (!isOnline) {
      setIsSpinning(true);
      setLastSpin(""); // Resettiamo per permettere a React di sentire il cambiamento dopo
      setPendingSpinData(null);
    }

    try {
      const res = await fetch(`${API_URL}/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          game_id: gameId,
          player_name: myName || playerNames[firstPlayerIdx || 0] 
        })
      });

      if (!res.ok) {
        const text = await res.text();
        let json: any = {};
        try { json = text ? JSON.parse(text) : {}; } catch (e) { json = {}; }
        showErrorMessage(t('wheel.notYourTurn'));
        
        if (!isOnline) setIsSpinning(false); // Fermiamo la ruota se c'è errore
        return false;
      }

      const data: SpinResp = await res.json();
      switch (data.value) {
          case 'Bancarotta':
            if (data.used_shields?.includes(myName) || (data.previous_player && data.used_shields?.includes(data.previous_player))){
              setWheelBankruptOverlayMsg(t('overlay.YouLandedBankruptShielded'));
            }else{
              if (numPlayers > 1){
                setWheelBankruptOverlayMsg(t('overlay.YouLandedBankrupt'));
              }else{
                setWheelBankruptOverlayMsg(t('overlay.YouLandedBankruptSingle'));
              }
            }
            break;
          case 'Passa':
            if (data.used_shields?.includes(myName) || (data.previous_player && data.used_shields?.includes(data.previous_player))){
              setWheelNextOverlayMsg(t('overlay.YouLandedNextShielded'));
            }else{
              setWheelNextOverlayMsg(t('overlay.YouLandedNext'));
            }
            break;
          case 'Scambia':
            if (data.previous_player === myName || (!myName && data.swapped_player)){
              setWheelSwapOverlayMsg(t('overlay.YouLandedSwap') + ' ' + data.swapped_player);
            }
            break;
        }
      setLastSpin(data.value);
      setPendingSpinData(data);
      setIsSpinning(false);    
      
      return data;

    } catch (err) {
      console.error(err);
      if (!isOnline) setIsSpinning(false);
      return false;
    }
  }

  async function handleGuess(letter: string){
    if(!gameId) return
    if(usedLetters[letter]) return
    if(!canGuess) {
      showErrorMessage(t('wheel.mustSpinFirst'));
      return;
    }
    // Do NOT mutate authoritative game state (used letters / canGuess / turn) before the server confirms.
    // Rely on the server response to provide `used_letters` and `can_guess` and reconcile the UI.
    // Previously we optimistically marked letters as used here; that made the client authoritative.
    try{
      const res = await fetch(`${API_URL}/guess-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, letter, player_name: myName, user_id: userId})
      })
      if (!res.ok) {
        const text = await res.text();
        let json: any = {};
        try { json = text ? JSON.parse(text) : {}; } catch (e) { json = {}; }
        showErrorMessage(json.error || json.message || `Server error ${res.status}`);
        return;
      }
      const data: GuessResp = await res.json()
      // Apply server-provided masked / used letters
      if (typeof data.masked === 'string') setMasked(data.masked)
      if (data.powerups) setPowerups(data.powerups);
      if (typeof data.current_player_idx === 'number') {
        setFirstPlayerIdx(data.current_player_idx);
        setCurrentOverlayPlayerName(playerNames[data.current_player_idx] || '');
      }
      if (data.added_score > 0) {
        setScoreIncrement(data.added_score)
        setShowScoreAnim(true)
        setTimeout(() => setShowScoreAnim(false), 1200)
        if (data.used_letters) setUsedLetters(data.used_letters)
        setCanGuess(false)
      }
      else {
        if (data.added_score == 0 && numPlayers > 1){
          setWrongLetterOverlayMsg(t('overlay.YouWrongLetter'));
          setShowWrongLetterOverlay(true);
        }else if (data.added_score == 0 && numPlayers === 1){
          setWrongLetterOverlayMsg(t('overlay.YouWrongLetterSingle'));
          setShowWrongLetterOverlay(true);
        }
        setWrongLetters(prev => ({ ...prev, [letter]: true }));
        setTimeout(() => {
          setWrongLetters(prev => {
            const copy = { ...prev };
            delete copy[letter];
            return copy;
          });
          // Only apply server-provided used_letters. Do NOT fallback to a local mutation
          // because that would make the client the source of truth.
          if (data.used_letters) setUsedLetters(data.used_letters);
          setCanGuess(false);

          if (numPlayers > 1 && typeof data.current_player_idx === 'number' && firstPlayerIdx !== null && data.current_player_idx !== firstPlayerIdx) {
            debugLog('handleGuess -> server changed turn to idx', data.current_player_idx, 'player', playerNames[data.current_player_idx]);
            const nextIdx = data.current_player_idx;
            const nextName = playerNames[nextIdx] || `Giocatore ${nextIdx + 1}`; // Fallback robusta
            setFirstPlayerIdx(nextIdx);
          }
        }, 400);
      }

      if (data.player_scores) {
        setPlayerScores(data.player_scores)
        if (typeof data.current_player_idx === 'number') {
          const curr = playerNames[data.current_player_idx]
          setScore(data.player_scores[curr] ?? 0)
        }
      }

      // Set current player index only if server provided it. Do not locally compute/rotate turn.
      if (typeof data.current_player_idx === 'number') {
        setFirstPlayerIdx(data.current_player_idx)
      }

      if (data.complete) setVictory(true)

      if (data.showReel && !showReel) {
        setPendingShowReel(true);
      }
      if (data.used_shields && data.used_shields.length > 0){
        setWrongLetterOverlayMsg(t('overlay.YouWrongLetterShielded'));
        setShowWrongLetterOverlay(true);
      }
    }catch(err){
      console.error(err)
    }
  }

  async function handleGuessPhrase(){
    if(!gameId) return
    try{
      const res = await fetch(`${API_URL}/guess-phrase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, guess: guessInput, player_name: myName, user_id: userId })
      })
      if (!res.ok) {
        setVictory(false);
        setShowPhraseInput(false);
        if (res.status == 403){
          showErrorMessage(t('actions.notYourTurnToGuess'));          
          return;
        }
        const text = await res.text();
        let json: any = {};
        try { json = text ? JSON.parse(text) : {}; } catch (e) { json = {}; }
        showErrorMessage(json.error || json.message || `Server error ${res.status}`);
        return;
      }
      const data: GuessPhraseResp = await res.json()
      if (typeof data.masked === 'string') setMasked(data.masked);


      // Prefer server authoritative player totals. Do NOT mutate authoritative totals locally.
      if (data.player_scores) {
        setPlayerScores(data.player_scores);
        if (typeof data.current_player_idx === 'number') {
          const curr = playerNames[data.current_player_idx];
          setScore(data.player_scores[curr] ?? 0);
        }
      } else {
        // If the server didn't return full player_scores, we only update the visible score
        // if the server provided a total_score. We do NOT award local bonuses or rotate turns locally.
        if (typeof data.total_score === 'number') {
          setScore(data.total_score);
          if (firstPlayerIdx !== null) {
            const player = playerNames[firstPlayerIdx];
            setPlayerScoreAbsolute(player, data.total_score);
          }
        }
      }

      if (data.success || data.complete) {
        setVictory(true)
        setMasked(data.masked)
      } else {
        // Rely on server-provided current_player_idx for turn changes when available
        if (numPlayers > 1 && typeof data.current_player_idx === 'number' && playerNames.length > 0) {
          const nextIdx = data.current_player_idx
          setFirstPlayerIdx(nextIdx);
          setTurnOverlayMsg('overlay.wrongAnswerTurn');
          setTurnOverlayIsError(true);
          setCurrentOverlayPlayerName(playerNames[nextIdx]);
          setShowTurnOverlay(true);
          setVictory(false);
          setShowPhraseInput(false);
        } else if (numPlayers === 1) {
          // Single player: mostra overlay errore custom
          setShowPhraseInput(false);
          setTurnOverlayMsg('overlay.wrongAnswerSingle');
          setTurnOverlayIsError(true);
          setCurrentOverlayPlayerName('');
          setShowTurnOverlay(true);
        } else {
          // Multiplayer but server did not provide next player: do not decide locally. No turn change.
          debugLog('handleGuessPhrase -> multiplayer and no current_player_idx from server; skipping local turn rotation');
        }
      }
      setGuessInput('')
    }catch(err){
      console.error(err)
    }
  }

  async function handleNewGameRequest() {
    // Always show confirmation overlay (singleplayer and multiplayer)
    setVictory(false);
    setShowTurnOverlay(false);
    // if (roomCode){
    //   if (roomHost !== myName){
    //     showErrorMessage(t('newGame.onlyHostCanStart'));
    //     return;
    //   }
    // }
    setShowNewGameConfirm(true);
  }

  function confirmNewGameYes() {
    // Return to start screen so user can change players/names
    setShowNewGameConfirm(false);
    // Chiudi la connessione WebSocket se attiva
    if (socketRef.current) {
      console.log("Closing WebSocket connection...");

      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          action: "close",
          room_code: roomCode,
          player: myName
        }));
      }
      socketRef.current.close();
      socketRef.current = null;
    }
    const targetPath = localizedStartPath;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  }

  async function confirmNewGameNo() {
    // Start a new game with the same players (scores will be reset by newGame)
    setShowNewGameConfirm(false);
    const targetPath = localizedGamePath;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
    await newGame(numPlayers, playerNames, topic);
  }

  function handleLettersGridClick() {
    if (canBuyVowel) {
      showErrorMessage(t('lettersGrid.selectVowel'));
    } else {
      showErrorMessage(t('wheel.mustSpinFirst'));
    }
  }

  function handleWheelClick() {
    showErrorMessage(t('wheel.mustSpinFirst'));
  }

  // language is handled by TranslationProvider (localStorage + context)

  const effectiveLang = pathLangAsLang && SUPPORTED_LANGS.includes(pathLangAsLang) ? pathLangAsLang : lang;
  const localizedStartPath = `/${effectiveLang}`;
  const localizedGamePath = `${localizedStartPath}/game`;
  const localizedRulesPath = `${localizedStartPath}/rules`;
  const localizedScoreboardPath = `${localizedStartPath}/scoreboard`;
  const ranking = useMemo(
      () => playerNames.map((name) => ({ name, score: playerScores[name] ?? 0, secretPhrase: masked })).sort((a, b) => b.score - a.score),
      [playerNames, playerScores, masked]
  );

  useEffect(() => {
    if (victory && pathname !== localizedScoreboardPath) {
      navigate(localizedScoreboardPath);
    }
  }, [victory, pathname, localizedScoreboardPath, navigate]);

  const pageName = t('start.title');
  const currentPathSuffix = restPath ? `/${restPath}` : '';
  const baseUrl = "https://spinwords.web.app";
  const urlIt = `${baseUrl}/it${currentPathSuffix}`;
  const urlEn = `${baseUrl}/en${currentPathSuffix}`;
  const urlDefault = `${baseUrl}/en${currentPathSuffix}`; // Default inglese

  return (
    <div className="app-root" style={{ padding: 16, fontFamily: 'sans-serif', position: 'relative' }}>
      <Helmet>
        <html lang={effectiveLang} />
        <link rel="alternate" hrefLang="it" href={urlIt} />
        <link rel="alternate" hrefLang="en" href={urlEn} />
        <link rel="alternate" hrefLang="x-default" href={urlDefault} />
        {/* Canonical: punta alla pagina corrente */}
        <link rel="canonical" href={`${baseUrl}/${effectiveLang}${currentPathSuffix}`} />
      </Helmet>
      <Routes>
        <Route path="/" element={<Navigate to={localizedStartPath} replace />} />
        <Route path="/game" element={<Navigate to={localizedGamePath} replace />} />
        <Route path="/rules" element={<Navigate to={localizedRulesPath} replace />} />
        <Route path="/scoreboard" element={<Navigate to={localizedScoreboardPath} replace />} />
        <Route
          path="/:lang"
          element={
            <StartScreenWrapper
              newGame={newGame}
              createRoom={createRoom}
              joinRoom={joinRoom}
              setNumPlayers={setNumPlayers}
              setPlayerNames={setPlayerNames}
              setPlayerScores={setPlayerScores}
              setFirstPlayerIdx={setFirstPlayerIdx}
              setTurnOverlayMsg={setTurnOverlayMsg}
              setTurnOverlayIsError={setTurnOverlayIsError}
              setShowTurnOverlay={setShowTurnOverlay}
            />
          }
        />
        <Route
          path="/:lang/lobby"
          element={
            <Lobby
              connectWebSocket={connectWebSocket} 
              playerNames={playerNames} // la lista nomi aggiornata
              topic={topic}             // La categoria scelta
            />
          }
        />
        <Route
          path="/:lang/game"
          element={
            !gameId ? (
              <Navigate to={localizedStartPath} replace />
            ) :(
              <>
            {/* 1. TITOLO PRINCIPALE (ESTERNO) */}
            <h1 className="title fancy-title">
              {pageName}
            </h1>
            <main className="game-layout">
              {/* LEFT COLUMN: players list with powerups below (separate component) */}
              <div className="game-sidebar">
                <Leaderboard
                 playerNames={playerNames}
                 playerScores={playerScores}
                 firstPlayerIdx={firstPlayerIdx}
                 powerups={powerups}
                 scoreChanges={scoreChanges}
               />
               {/* POWERUPS: in its own container directly below the players list */}
                {numPlayers > 1 && (
                    <Powerups
                      onUse={handlePowerupUse}
                      powerups={powerups}
                      isSpinning={isSpinning}
                      canGuess={canGuess}
                      playerNames={playerNames.filter(name => name !== (myName || playerNames[firstPlayerIdx || 0]))}
                      playerName={myName}
                    />
                )}
              </div>
              {/* LEFT: categoria, frase segreta, griglia lettere */}
              <div className="game-main-content">
                <GameInfo topic={topic} masked={masked} />

                <LettersGrid
                  usedLetters={usedLetters}
                  wrongLetters={wrongLetters}
                  canBuyVowel={canBuyVowel}
                  canGuess={canGuess}
                  isSpinning={isSpinning}
                  victory={victory}
                  onGuessLetter={handleGuess}
                  onGuessVowel={handleGuessVowel}
                  onGridClick={handleLettersGridClick}
                />

                <GameActions
                  showPhraseInput={showPhraseInput}
                  victory={victory}
                  score={score}
                  canGuess={canGuess}
                  guessInput={guessInput}
                  terminatedVowels={terminatedVowels}
                  onShowPhraseInput={() => {
                    if (myName && myName !== playerNames[firstPlayerIdx || 0]) {
                      showErrorMessage(t('actions.notYourTurnToGuess'));
                      return;
                    }
                    setShowPhraseInput(true);
                    return;
                  }}
                  onBuyVowel={handleBuyVowel}
                  onShowRules={handleShowRules}
                  onNewGame={handleNewGameRequest}
                  onGuessInputChange={setGuessInput}
                  onGuessPhrase={handleGuessPhrase}
                  onHidePhraseInput={() => setShowPhraseInput(false)}
                />
              </div>

              

              {/* CENTER: ruota e score */}
              <GameCenter
                playerName={firstPlayerIdx !== null ? playerNames[firstPlayerIdx] : ''}
                score={firstPlayerIdx !== null ? (playerScores[playerNames[firstPlayerIdx]] ?? 0) : 0}
                lastSpin={lastSpin}
                scoreIncrement={scoreIncrement}
                showScoreAnim={showScoreAnim}
                scoreDecrement={scoreDecrement}
                showScoreDecAnim={showScoreDecAnim}
                isSpinning={isSpinning}
                canGuess={canGuess}
                numPlayers={numPlayers}
                onSpin={handleSpin}
                onSpinEnd={() => {
                  // Recuperiamo i dati che il WebSocket ci ha salvato poco fa
                  const result = pendingSpinData; 
                  if (!result) return;
                  
                  const { value, old_score } = result;

                  // --- 1. ANIMAZIONI VISIVE (Bancarotta, ecc.) ---
                  if (value === 'Bancarotta' || value === 'bancarotta') {
                    setShowWheelBankruptOverlay(true);
                    setScoreDecrement(old_score ?? 0);
                    setShowScoreDecAnim(true);
                    setTimeout(() => setShowScoreDecAnim(false), 1200);
                  }

                  if (value === 'Passa' || value === 'passa') {
                    setShowWheelNextOverlay(true);
                  }

                  if (value === 'Scambia' || value === 'scambia') {
                    setShowSwapOverlay(true);
                  }

                  // --- 2. AGGIORNAMENTO STATO AUTOREVOLE ---
                  if (result.player_scores) {
                    setPlayerScores(result.player_scores);
                    if (typeof result.current_player_idx === 'number') {
                      const idx = result.current_player_idx;
                      const curr = playerNames[idx];
                      setScore(result.player_scores[curr] ?? 0);
                    }
                  }

                  if (result.used_letters) setUsedLetters(result.used_letters);
                  if (result.masked) setMasked(result.masked);
                  if (result.complete) setVictory(true);
                  if (typeof result.can_guess === 'boolean') setCanGuess(result.can_guess);
                  if (result.powerups) setPowerups(result.powerups);
                  if (result.last_spin) setLastSpin(result.last_spin);

                  // --- 3. CAMBIO TURNO E OVERLAYS ---
                  if (typeof result.current_player_idx === 'number') {
                    const serverIdx = result.current_player_idx;
                    const prevIdx = firstPlayerIdx;
                    setFirstPlayerIdx(serverIdx);
                  }                  
                  // IMPORTANTE: puliamo il cassetto per il prossimo giro
                  setPendingSpinData(null);
                }}
                onNewGame={handleNewGameRequest}
                onWheelClick={handleWheelClick}
              />
            </main>
              </>
          )}
        />
        <Route
          path="/:lang/scoreboard"
          element={(
            <ScoreboardPage
              ranking={ranking}
              onPlayAgain={handleNewGameRequest}
            />
          )}
        />
        <Route path="/:lang/rules" element={<RulesPage />} />
        <Route path="*" element={<Navigate to={localizedStartPath} replace />} />
          </Routes>

      {/* Overlays */}
      <TurnOverlay
        // Show when the overlay flag is set and there is either a message key or (in multiplayer) a player name
        show={showTurnOverlay && ( !!turnOverlayMsg || (numPlayers > 1 && !!currentOverlayPlayerName) )}
        playerName={numPlayers > 1 ? currentOverlayPlayerName : ''}
        messageKey={turnOverlayMsg} 
        isError={turnOverlayIsError}
      />
      <ShieldOverlay 
        show={showShieldOverlay}
        messageKey={shieldOverlayMsg}
      />
      <DoubleOverlay
        show={showDoubleOverlay}
        messageKey={doubleOverlayMsg}
      />
      <SkipOverlay
        show={showSkipOverlay}
        messageKey={skipOverlayMsg}
      />
      <LoseItAllOverlay
        show={showLoseItAllOverlay}
        messageKey={loseItAllOverlayMsg}
      />
      <WrongLetterOverlay 
        show={showWrongLetterOverlay}
        messageKey={wrongLetterOverlayMsg}
      />
      <WheelBankruptOverlay
        show={showWheelBankruptOverlay}
        messageKey={wheelBankruptOverlayMsg}
      />
      <WheelNextOverlay
        show={showWheelNextOverlay}
        messageKey={wheelNextOverlayMsg}
      />
      <SwapOverlay
        show={showSwapOverlay}
        messageKey={wheelSwapOverlayMsg}
      />
      <BoughtVowelOverlay
        show={showBoughtVowelOverlay}
        messageKey={boughtVowelOverlayMsg}
      />
      <GuessPhraseIncorrectOverlay
        show={showGuessPhraseIncorrectOverlay}
        messageKey={guessPhraseIncorrectOverlayMsg}
      />
      <ReelOverlay 
        show={showReelOverlay}
        messageKey={reelOverlayMsg}
      />
      {/* New-game confirmation overlay (same style as TurnOverlay) */}
      {showNewGameConfirm && (
        <div className={`overlay victory-overlay`}>
          <div className={`overlay-box victory-box`}>
            <span role="img" aria-label="star" style={{ fontSize: 64, marginBottom: 8 }}>⭐</span>
            <h2 className={`overlay-title victory-title`}>{t('newgame.confirmTitle')}</h2>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, justifyContent: 'center' }}>
                <button className="new-game-btn" onClick={confirmNewGameYes} style={{ padding: '8px 14px' }}>{t('common.yes')}</button>
                <button className="new-game-btn" onClick={confirmNewGameNo} style={{ padding: '8px 14px' }}>{t('common.no')}</button>
                <button className="new-game-btn-cancel" onClick={() => setShowNewGameConfirm(false)} style={{ padding: '8px 14px' }}>{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      )}
      <ErrorOverlay show={!!errorMsg} message={errorMsg} />
      <HalfGameReel
        show={showReel}
        result={reelResult}
        onClose={handleReelClose}
      />
      <footer style={{ marginTop: 24 }}>
      </footer>
    </div>
  )

}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}