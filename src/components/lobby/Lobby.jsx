import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import './Lobby.css';
import LoadingSpinner from '../loading_spinner/LoadingSpinner';
import { useTranslation } from '../../i18n/TranslationProvider';
import { API_URL } from '../../constants/constants';

export default function Lobby({ 
  setGameId, 
  setPlayerNames, 
  setNumPlayers, 
  setTopic, 
  setMasked, 
  setPlayerScores, 
  setFirstPlayerIdx 
}) {
  const { t, lang } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  if (!state || !state.room_code) {
    return <Navigate to={`/${lang}`} replace />;
  }

  const { room_code, capacity, my_name } = state;
  const [players, setPlayers] = useState(state.players || []);
  const playersRef = useRef(players);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // Funzione helper per aggiornare tutto lo stato del gioco
  const updateGameState = (data) => {
     if (data.topic && setTopic) setTopic(data.topic);
     if (data.masked && setMasked) setMasked(data.masked);
     if (data.player_scores && setPlayerScores) setPlayerScores(data.player_scores);
     if (typeof data.current_player_idx === 'number' && setFirstPlayerIdx) setFirstPlayerIdx(data.current_player_idx);
  };

  // Se il gioco è già stato avviato (presente nello stato o ricevuto dalla join), naviga subito
  useEffect(() => {
    if (state.game_id) {
      console.log('Game already started (from state):', state.game_id);
      setGameId(state.game_id);
      if (state.players) {
        setPlayerNames(state.players);
        setNumPlayers(state.players.length);
      }
      // Aggiorna anche gli altri stati se presenti nello state iniziale
      updateGameState(state);
      navigate(`/${lang}/game`, { replace: true });
    }
  }, [state, setGameId, setPlayerNames, setNumPlayers, navigate, lang, setTopic, setMasked, setPlayerScores, setFirstPlayerIdx]);

  useEffect(() => {
    // Pulisce l'URL base sostituendo http->ws e rimuovendo slash finali
    const cleanApiUrl = API_URL.replace(/\/$/, "");
    let wsBase = cleanApiUrl.replace(/^http/, 'ws');
    
    // CORREZIONE: L'endpoint backend è definito come /ws, senza parametri nell'URL
    const wsUrl = `${wsBase}/ws`;
    console.log('Connecting to WS:', wsUrl);
    
    let isCancelled = false;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Se il componente è stato smontato o la connessione è stata annullata, chiudi e non inviare nulla
      if (isCancelled) {
        ws.close();
        return;
      }

      console.log('WS Connected. Status:', ws.readyState);
      
      // Controllo di sicurezza: invia solo se la connessione è aperta
      if (ws.readyState === WebSocket.OPEN) {
        console.log('Sending join message...');
        ws.send(JSON.stringify({
          action: "join",
          room_code: room_code, // Uniformato al backend (snake_case)
          player: my_name
        }));
      }
    };

    ws.onmessage = (event) => {
      if (isCancelled) return;

      try {
        const data = JSON.parse(event.data);
        console.log('WS message:', data);

        // Se riceviamo 'start_game' OPPURE un altro messaggio che contiene game_id, avvia il gioco
        if (data.type === 'start_game' || (data.game_id && (data.type === 'room_state' || data.type === 'player_joined'))) {
          console.log('Game starting!', data.game_id);
          setGameId(data.game_id);
          
          const currentPlayers = data.players || playersRef.current;
          setPlayerNames(currentPlayers);
          setNumPlayers(currentPlayers.length);
          
          // Propaga i dati di gioco (topic, masked, scores, turn)
          updateGameState(data);

          navigate(`/${lang}/game`);
        } else if (data.type === 'room_state' || data.type === 'player_joined') {
          // Il backend invia la lista aggiornata 'players' in entrambi i casi
          if (data.players && Array.isArray(data.players)) {
            setPlayers(data.players);
          } else if (data.player) {
            // Fallback nel caso manchi la lista completa
             setPlayers(prev => {
               if (prev.includes(data.player)) return prev;
               return [...prev, data.player];
             });
          }
        } else if (data.type === 'player_left') {
           setPlayers(prev => prev.filter(p => p !== data.player));
        }
      } catch (err) {
        console.error('WS Message error:', err);
      }
    };

    ws.onerror = (err) => {
      if (!isCancelled) {
        console.error('WS Error:', err);
      }
    };

    ws.onclose = (event) => {
      if (!isCancelled) {
        console.log("WS Closed. Code:", event.code, "Reason:", event.reason);
      }
    };

    return () => {
      isCancelled = true;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [room_code, my_name, navigate, lang, setGameId, setPlayerNames, setNumPlayers]);

  return (
    <div className="lobby-page">
      {/* Decorative background elements matching StartScreen */}
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

      <h1 className="lobby-title title fancy-title">{t('start.title')}</h1>
      <div className="lobby-card">
        <h2 className="lobby-waiting-text">{t('lobby.waiting')}</h2>
        
        <div className="lobby-details">
          <div className="lobby-section">
            <span className="lobby-label">{t('lobby.roomCode')}</span>
            <span className="lobby-value room-code">{room_code}</span>
          </div>

          <div className="lobby-section">
             <span className="lobby-label">{t('lobby.players')} ({players.length}/{capacity})</span>
             <ul className="lobby-player-list">
               {players.map((p, i) => (
                 <li key={i} className="lobby-player-item">{p}</li>
               ))}
             </ul>
          </div>
        </div>
        
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
           className="lobby-back-btn" 
           onClick={() => navigate(`/${lang}/`)}
          >
           {t('lobby.back')}
          </button>
        </div>
      </div>
    </div>
  );
}
