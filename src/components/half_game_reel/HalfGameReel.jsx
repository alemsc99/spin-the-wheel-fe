import { useEffect, useRef, useState } from 'react';
import './HalfGameReel.css';

// Visual values and backend keys mapping
const valueMap = [
  { key: 'x0.5', label: 'x0.5' },
  { key: 'Evil', label: '😈' },
  { key: 'x2', label: 'x2' },
  { key: 'New_Phrase', label: '🆕' },
  { key: 'x5', label: 'x5' },
];

const backendKeys = valueMap.map(v => v.key);
const INITIAL_SPEED = 60; // ms velocità iniziale
const FINAL_SPEED = 350; // ms velocità finale
const SPIN_ROUNDS = 2; // giri completi minimi

export default function HalfGameReel({ show, result, onClose }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [spinning, setSpinning] = useState(true);
  const [stopped, setStopped] = useState(false);
  const timeoutRef = useRef(null);
  // result può essere 'Evil' o 'New_Phrase', mappiamo all'indice corretto
  const resultIdx = result ? backendKeys.indexOf(result) : -1;

  // Reset all state on show
  useEffect(() => {
    if (!show) return;
    setSpinning(true);
    setStopped(false);
    setCurrentIdx(Math.floor(Math.random() * valueMap.length));
  }, [show]);

  // Decelerating spin effect
  useEffect(() => {
    if (!show || !spinning || resultIdx === -1) return;

    let totalSteps = valueMap.length * SPIN_ROUNDS + ((resultIdx - currentIdx + valueMap.length) % valueMap.length);
    let count = 0;

    function spinStep(idx, speed) {
      timeoutRef.current = setTimeout(() => {
        setCurrentIdx(i => (i + 1) % valueMap.length);
        count++;
        if (count < totalSteps) {
          // Ease out: velocità cresce con i passi
          const t = count / totalSteps;
          const easedSpeed = Math.round(INITIAL_SPEED + (FINAL_SPEED - INITIAL_SPEED) * Math.pow(t, 2));
          spinStep((idx + 1) % valueMap.length, easedSpeed);
        } else {
          setSpinning(false);
          setStopped(true);
        }
      }, speed);
    }
    spinStep(currentIdx, INITIAL_SPEED);
    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line
  }, [show, spinning, resultIdx]);

  // Auto-close overlay 2s dopo che si ferma
  useEffect(() => {
    if (stopped && show && resultIdx !== -1) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [stopped, show, resultIdx, onClose]);

  if (!show) return null;

  // Calcola la larghezza massima del valore più lungo
  const maxLabel = valueMap.reduce((max, v) => v.label.length > max.length ? v.label : max, '');

  return (
    <div className="reel-overlay">
      <div className="reel-box">
        <div className="reel-values" style={{ minWidth: `${maxLabel.length + 5}ch`, textAlign: 'center' }}>
          {valueMap.map((v, i) => (
            <div key={v.key} className={`reel-value${i === currentIdx ? ' selected' : ''}`}>{v.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}