import { useState } from 'react';
import './Powerups.css';
import { POWERUP_PRICES } from '../../constants/constants';
import { IMAGES } from '../../constants/constants';

/**
 * @param {{ onUse: (powerup: string, target?: string|null) => Promise<void> | void, powerups?: Record<string, string[]>, isSpinning?: boolean, canGuess?: boolean, playerNames?: string[], currentPlayerIdx?: number }} props
*/
export default function Powerups({ onUse, powerups = {}, isSpinning = false, canGuess = false, playerNames = [], currentPlayerIdx = undefined }) {
  // accept powerups prop (default empty) to satisfy TS usage from App.tsx
  // when used it can be read to mark active powerups in the UI if desired
  const items = [ 'Skip', 'Double', 'Lose', 'Shield'];
  const disabled = isSpinning || canGuess; // disabilita dopo che si è girata la ruota o durante lo spin

  const [showTargetOverlay, setShowTargetOverlay] = useState(false);
  const [pendingPowerup, setPendingPowerup] = useState(null);

  function handlePowerupClick(p) {
    if (disabled) return;
    // For Skip and Lose we require a target selection
    if (p === 'Skip' || p === 'Lose') {
      setPendingPowerup(p);
      setShowTargetOverlay(true);
      return;
    }
    // others: immediate use with no target
    onUse(p, null);
  }

  function handleSelectTarget(targetName) {
    if (!pendingPowerup) return;
    onUse(pendingPowerup, targetName);
    setShowTargetOverlay(false);
    setPendingPowerup(null);
  }

  function handleCancelTarget() {
    setShowTargetOverlay(false);
    setPendingPowerup(null);
  }

  // Build list of other players (exclude current)
  const otherPlayers = playerNames.filter((_, idx) => idx !== currentPlayerIdx);

  return ( 
    <div className="powerups-root">
      <h4 className="powerups-title">Powerups</h4>
      <div className="powerups-grid">
        {items.map((p) => (
          <button
            key={p}
            className={`powerup-card vertical powerup-button ${disabled ? 'disabled' : ''}`}
            onClick={() => handlePowerupClick(p)}
            disabled={disabled}
            title={disabled ? 'I powerup sono disponibili solo prima di girare la ruota' : ''}
            aria-disabled={disabled}
          >
            <div className="powerup-img-wrapper">
              <img className="powerup-image" src={IMAGES[p]} alt="" />
            </div>
            <span className="powerup-price">{POWERUP_PRICES[p]} 🪙</span>
          </button>
        ))}
      </div>

      {/* Target selection overlay (appears when Skip or Lose clicked) */}
      {showTargetOverlay && (
        <div className="overlay target-overlay">
          <div className="overlay-box">
            <h3 style={{ marginBottom: 12 }}>Scegli un giocatore</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
              {otherPlayers.length === 0 && <div>Nessun altro giocatore</div>}
              {otherPlayers.map((name) => (
                <button key={name} className="target-btn" onClick={() => handleSelectTarget(name)}>{name}</button>
              ))}
              <button className="target-cancel-btn" onClick={handleCancelTarget}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}