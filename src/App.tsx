import { useEffect, useState } from 'react'
import Header from './components/header/Header.jsx';
import GameInfo from './components/game_info/GameInfo.jsx';
import LettersGrid from './components/letters_grid/LettersGrid.jsx';
import GameActions from './components/game_actions/GameActions.jsx';
import GameCenter from './components/game_center/GameCenter.jsx';
import { VictoryOverlay, ErrorOverlay } from './components/overlays/Overlays.jsx';
import StartScreenWrapper from './components/start_screen/StartScreenWrapper.tsx';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import "./components/letters_grid/LettersGrid.css";
import { useTranslation } from './i18n/TranslationProvider';
import TurnOverlay from './components/overlays/TurnOverlay.tsx';
import { GuessPhraseResp, GuessResp, NewGameResp, SpinResp } from './types/api.ts';
import { debugLog } from './utils/utils.ts';
import { API_URL } from './constants/constants.jsx';
import useScoreManager from './hooks/ScoreManager.ts';


export default function App() {

  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [playerScores, setPlayerScores] = useState<Record<string, number>>({});
  const [firstPlayerIdx, setFirstPlayerIdx] = useState<number|null>(null);
  const [currentOverlayPlayerName, setCurrentOverlayPlayerName] = useState<string>('');
  const [showTurnOverlay, setShowTurnOverlay] = useState(false);
  const [turnOverlayMsg, setTurnOverlayMsg] = useState('');
  const [turnOverlayIsError, setTurnOverlayIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { t } = useTranslation();
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
  const [victory, setVictory] = useState(false);
  const [defeat, setDefeat] = useState(false);
  const [canGuess, setCanGuess] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showPhraseInput, setShowPhraseInput] = useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);

  const scoreManager = useScoreManager({ API_URL, gameId, playerNames, firstPlayerIdx, setPlayerScores, setScore });
  const { incrementPlayerScore, setPlayerScoreAbsolute } = scoreManager;
  

  useEffect(() => {
    if (showTurnOverlay) {
      const timer = setTimeout(() => {
        setShowTurnOverlay(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showTurnOverlay]);

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

  async function newGame(players: number, names: string[]){
    try{
      const res = await fetch(`${API_URL}/new-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          num_players: players,
          player_names: names
        })
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data: NewGameResp & { num_players?: number, player_names?: string[], player_scores?: Record<string,number>, current_player_idx?: number, used_letters?: Record<string, boolean>, last_spin?: string | number, masked?: string, complete?: boolean } = await res.json()

      // Accept and apply server-provided authoritative state fields when present.
      setGameId(data.game_id ?? null)
      if (typeof data.topic === 'string') setTopic(data.topic)
      if (typeof data.masked === 'string') setMasked(data.masked)
      setLastSpin(data.last_spin !== undefined ? data.last_spin : 0)
      setUsedLetters(data.used_letters ?? {})
      setGuessInput('')
      setVictory(!!data.complete)
      setDefeat(false)
      setCanGuess(false)
      setCanBuyVowel(false)
      setIsSpinning(false)
      setShowPhraseInput(false)
      setWrongLetters({})

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

  async function handleBuyVowel() {
    if (!gameId) return;
    // Ask server to charge the vowel cost and return authoritative state.
    try {
      const res = await fetch(`${API_URL}/buy-vowel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId })
      });
      if (!res.ok) {
        const text = await res.text();
        let json: any = {};
        try { json = text ? JSON.parse(text) : {}; } catch (e) { json = {}; }
        showErrorMessage(json.detail || json.error || json.message || t('buyVowel.lowMoney'));
        return;
      }
      const data: any = await res.json();

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

  async function handleGuessVowel(vowel: string) {
    if (!gameId) return;
  // Do not rely on client-side usedLetters for validation/security; server will reject already-used vowels.
    // Trigger buy+reveal in a single server request: POST /buy-vowel with letter
    setCanBuyVowel(false);
    try {
      const res = await fetch(`${API_URL}/buy-vowel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, letter: vowel })
      });
      if (!res.ok) {
        const text = await res.text();
        let json: any = {};
        try { json = text ? JSON.parse(text) : {}; } catch (e) { json = {}; }
        showErrorMessage(json.detail || json.error || json.message || `Server error ${res.status}`);
        return;
      }
      const data: any = await res.json();

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
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSpin(): Promise<SpinResp | false>{
    if(!gameId) return false
    if (isSpinning) {
      showErrorMessage(t('wheel.mustSpinFirst'));
      return false;
    }
    if (canGuess) {
      showErrorMessage(t('wheel.mustSpinFirst'));
      return false;
    }
    setIsSpinning(true);
    try{
      const res = await fetch(`${API_URL}/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId })
      })
      if (!res.ok) {
        const text = await res.text();
        let json: any = {};
        try { json = text ? JSON.parse(text) : {}; } catch (e) { json = {}; }
        showErrorMessage(json.error || json.message || `Server error ${res.status}`);
        setIsSpinning(false);
        return false;
      }
      const data: SpinResp = await res.json()
      return data
    }catch(err){
      console.error(err)
      setIsSpinning(false);
      return false
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
        body: JSON.stringify({ game_id: gameId, letter })
      })
      if (!res.ok) {
        const text = await res.text();
        let json: any = {};
        try { json = text ? JSON.parse(text) : {}; } catch (e) { json = {}; }
        showErrorMessage(json.error || json.message || `Server error ${res.status}`);
        return;
      }
      const data: GuessResp & { player_scores?: Record<string,number>, current_player_idx?: number, used_letters?: Record<string, boolean>, masked?: string, complete?: boolean } = await res.json()

      // Apply server-provided masked / used letters
      if (typeof data.masked === 'string') setMasked(data.masked)

      if (data.added_score > 0) {
        setScoreIncrement(data.added_score)
        setShowScoreAnim(true)
        setTimeout(() => setShowScoreAnim(false), 1200)
        if (data.used_letters) setUsedLetters(data.used_letters)
        setCanGuess(false)
      }
      else {
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

          // Rely on server-provided current_player_idx for turn changes when available
          if (numPlayers > 1 && typeof data.current_player_idx === 'number' && firstPlayerIdx !== null && data.current_player_idx !== firstPlayerIdx) {
            debugLog('handleGuess -> server changed turn to idx', data.current_player_idx, 'player', playerNames[data.current_player_idx]);
            setFirstPlayerIdx(data.current_player_idx);
            setTurnOverlayMsg('overlay.changeTurn');
            setTurnOverlayIsError(false);
            setCurrentOverlayPlayerName(playerNames[data.current_player_idx]);
            setShowTurnOverlay(true);
          }
        }, 400);
      }

      // Prefer server player_scores; otherwise increment locally
      // Apply authoritative player totals if server returned them. Do NOT compute/increment totals locally based on added_score.
      if (data.player_scores) {
        setPlayerScores(data.player_scores)
        if (typeof data.current_player_idx === 'number') {
          const curr = playerNames[data.current_player_idx]
          setScore(data.player_scores[curr] ?? 0)
        }
      } else {
        // If server did not provide player_scores, we don't mutate authoritative totals locally.
        // We still show UI animation for added_score above, but rely on the server to provide final totals.
      }

      // Set current player index only if server provided it. Do not locally compute/rotate turn.
      if (typeof data.current_player_idx === 'number') {
        setFirstPlayerIdx(data.current_player_idx)
      }

      if (data.complete) setVictory(true)
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
        body: JSON.stringify({ game_id: gameId, guess: guessInput })
      })
      if (!res.ok) {
        const text = await res.text();
        let json: any = {};
        try { json = text ? JSON.parse(text) : {}; } catch (e) { json = {}; }
        showErrorMessage(json.error || json.message || `Server error ${res.status}`);
        return;
      }
      const data: GuessPhraseResp & { player_scores?: Record<string,number>, current_player_idx?: number, masked?: string, success?: boolean, complete?: boolean, total_score?: number } = await res.json()

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
            debugLog('handleGuessPhrase -> updating UI score to', data.total_score, 'for', player);
            setPlayerScoreAbsolute(player, data.total_score);
          }
        }
      }

      if (data.success || data.complete) {
        setVictory(true)
      } else {
        // Rely on server-provided current_player_idx for turn changes when available
        if (numPlayers > 1 && typeof data.current_player_idx === 'number' && playerNames.length > 0) {
          const nextIdx = data.current_player_idx
          debugLog('handleGuessPhrase -> server set next player to', nextIdx, playerNames[nextIdx]);
          setFirstPlayerIdx(nextIdx);
          setTurnOverlayMsg('overlay.wrongAnswerTurn');
          setTurnOverlayIsError(true);
          setCurrentOverlayPlayerName(playerNames[nextIdx]);
          setShowTurnOverlay(true);
        } else if (numPlayers === 1) {
          // Single player: mostra overlay errore custom
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

  // Handler invoked from GameCenter "Nuova partita" button.
  // If multiplayer, show confirmation overlay; otherwise start a new game immediately.
  async function handleNewGameRequest() {
    // Always show confirmation overlay (singleplayer and multiplayer)
    // Hide victory/turn overlays so the confirmation is on top
    setVictory(false);
    setShowTurnOverlay(false);
    setShowNewGameConfirm(true);
    // User will decide Yes/No in the overlay
  }

  function confirmNewGameYes() {
    // Return to start screen so user can change players/names
    setShowNewGameConfirm(false);
    // Navigate back to the start route
    window.location.href = '/';
  }

  async function confirmNewGameNo() {
    // Start a new game with the same players (scores will be reset by newGame)
    setShowNewGameConfirm(false);
    await newGame(numPlayers, playerNames);
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

  return (
    <BrowserRouter>
      <div className="app-root" style={{ padding: 16, fontFamily: 'sans-serif', position: 'relative' }}>
      <Header />

      <Routes>
        <Route path="/" element={<StartScreenWrapper
          newGame={newGame}
          setNumPlayers={setNumPlayers}
          setPlayerNames={setPlayerNames}
          setPlayerScores={setPlayerScores}
          setFirstPlayerIdx={setFirstPlayerIdx}
          setTurnOverlayMsg={setTurnOverlayMsg}
          setTurnOverlayIsError={setTurnOverlayIsError}
          setShowTurnOverlay={setShowTurnOverlay}
        />} />
        <Route
          path="/game"
          element={(
            <main style={{ display: 'flex', gap: 40, marginTop: 50 }}>
              {/* PLAYER LIST COLUMN */}
              <aside style={{ minWidth: 180, background: '#f7f7f7', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px #eee', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', height: 'fit-content' }}>
                <h3 style={{ margin: '0 0 12px 0', fontWeight: 700, color: '#d14c4c', fontSize: 18 }}>{t('players.title')}</h3>
                {playerNames.map((name, idx) => {
                  const isActive = firstPlayerIdx === idx;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 10,
                        width: '100%'
                      , background: isActive ? '#e3f0ff' : undefined,
                      border: isActive ? '2px solid #1976d2' : '2px solid transparent',
                      borderRadius: 10,
                      boxShadow: isActive ? '0 0 8px #90caf9' : undefined,
                      position: 'relative',
                      padding: isActive ? '6px 8px' : '4px 8px',
                      transition: 'background 0.2s, border 0.2s, box-shadow 0.2s'
                      }}
                    >
                      <span style={{
                        fontWeight: 600,
                        color: '#333',
                        flex: 1,
                        maxWidth: 1500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        verticalAlign: 'middle',
                        lineHeight: '1.2em',
                        cursor: 'default'
                      }} title={name}>{name}</span>
                      <span style={{ background: '#ffd54f', borderRadius: 8, padding: '2px 12px', fontWeight: 700, color: '#222', minWidth: 32, textAlign: 'center' }}>{(playerScores[name] ?? 0)} €</span>
                    </div>
                  );
                })}
              </aside>

              {/* LEFT: categoria, frase segreta, griglia lettere */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  onShowPhraseInput={() => setShowPhraseInput(true)}
                  onBuyVowel={handleBuyVowel}
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
                onSpinEnd={(spinResult: SpinResp) => {
                  debugLog('onSpinEnd -> spinResult', spinResult);
                  const { value, old_score, new_score } = spinResult as any;

                  // Prefer server-provided last_spin if present, otherwise use value
                  const serverLast = (spinResult as any).last_spin !== undefined ? (spinResult as any).last_spin : value;
                  setLastSpin(serverLast);

                  // Keep animations for special outcomes (visual only). Do NOT apply turn/score logic locally based solely on the value.
                  if (value === 'Bancarotta') {
                    setScoreDecrement(old_score ?? 0);
                    setShowScoreDecAnim(true);
                    setTimeout(() => setShowScoreDecAnim(false), 1200);
                  }

                  // Apply server authoritative fields when present. Do not infer turn/score from `value`.
                  const server = spinResult as any;
                  if (server.player_scores) {
                    setPlayerScores(server.player_scores);
                    if (typeof server.current_player_idx === 'number') {
                      const idx = server.current_player_idx
                      const curr = playerNames[idx]
                      setScore(server.player_scores[curr] ?? 0)
                    }
                  }

                  if (server.used_letters) {
                    setUsedLetters(server.used_letters)
                  }

                  if (typeof server.current_player_idx === 'number') {
                    const serverIdx = server.current_player_idx
                    // Show turn overlay only if the server changed the active player.
                    const prevIdx = firstPlayerIdx
                    setFirstPlayerIdx(serverIdx)
                    if (playerNames.length > 1 && serverIdx !== prevIdx) {
                      setTurnOverlayMsg('overlay.changeTurn')
                      setTurnOverlayIsError(false)
                      setCurrentOverlayPlayerName(playerNames[serverIdx] ?? '')
                      setShowTurnOverlay(true)
                    }
                  }

                  
                  // Show swap overlay when server includes swapped_player (name or index)
                  if (server.swapped_player !== undefined && server.swapped_player !== null) {
                    const s = server.swapped_player;
                    // get overlay.swapPlayer value translated
                    let overlayMsg = t('overlay.swapPlayers');
                    // append swapped player name if string
                    if (typeof s === 'string') {
                      overlayMsg += ` ${s}`;
                    }
                    setTurnOverlayMsg(overlayMsg);
                    setTurnOverlayIsError(false);
                    setCurrentOverlayPlayerName(s);
                    setShowTurnOverlay(true);
                  }

                  // Respect server-provided masked/complete/can_guess (if present). Do not derive them from value.
                  if (server.masked) setMasked(server.masked)
                  if (server.complete) setVictory(true)
                  if (typeof server.can_guess === 'boolean') setCanGuess(server.can_guess)

                  setIsSpinning(false);
                }}
                onNewGame={handleNewGameRequest}
                onWheelClick={handleWheelClick}
              />
            </main>
          )}
        />
      </Routes>

  {/* Overlays */}
      <TurnOverlay
        // Show when the overlay flag is set and there is either a message key or (in multiplayer) a player name
        show={showTurnOverlay && ( !!turnOverlayMsg || (numPlayers > 1 && !!currentOverlayPlayerName) )}
        playerName={numPlayers > 1 ? currentOverlayPlayerName : ''}
        messageKey={turnOverlayMsg} 
        isError={turnOverlayIsError}
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
            </div>
          </div>
        </div>
      )}
      <VictoryOverlay 
        show={victory} 
        onNewGame={handleNewGameRequest}
        ranking={playerNames.map((name) => ({ name, score: playerScores[name] ?? 0 }))
          .sort((a, b) => b.score - a.score)}
      />
      <ErrorOverlay show={!!errorMsg} message={errorMsg} />

      <footer style={{ marginTop: 24 }}>
      </footer>
    </div>
    </BrowserRouter>
  )

}