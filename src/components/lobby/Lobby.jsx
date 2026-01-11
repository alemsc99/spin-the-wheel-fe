import React, { useEffect, useState } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import './Lobby.css';
import { useTranslation } from '../../i18n/TranslationProvider';

export default function Lobby({ 
  playerNames,       // Dalla prop di App.tsx (lista nomi aggiornata via socket)
  connectWebSocket   // La funzione che crea il socket in App.tsx
}) {
  const { t, lang } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  // 1. Controllo di sicurezza: se non abbiamo i dati della stanza, torniamo alla home
  if (!state || !state.room_code) {
    return <Navigate to={`/${lang}`} replace />;
  }

  const { room_code, capacity, my_name } = state;

  const [copied, setCopied] = useState(false);

  // 2. Connessione al WebSocket al caricamento del componente
  useEffect(() => {
    // Chiamiamo la funzione passata da App.tsx
    // Passiamo room_code e my_name così il socket può fare la "join"
    connectWebSocket(room_code, my_name);
  }, [room_code, my_name, connectWebSocket]);

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
            <div className="room-code-row">
              <span className="lobby-value room-code">{room_code}</span>
              <button
                type="button"
                className="copy-room-btn"
                aria-label={t('lobby.copy')}
                title={t('lobby.copy')}
                onClick={() => {
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(room_code);
                  }
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                📋
              </button>
              {copied && (
                <span className="copy-confirm">{t('lobby.copied')}</span>
              )}
            </div>
          </div>

          <div className="lobby-section">
             <span className="lobby-label">{t('lobby.players')} ({playerNames.length}/{capacity})</span>
             <ul className="lobby-player-list">
               {playerNames.map((p, i) => (
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