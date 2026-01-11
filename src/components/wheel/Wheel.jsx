import { useEffect, useRef, useMemo, useState } from "react";
import "./Wheel.css"; 
import { useTranslation } from '../../i18n/TranslationProvider';

const MULTIPLAYER_LAYOUT = ["Bancarotta", "100", "500", "Passa", "200", "400", "Swap", "300", "600", "Bancarotta", "100", "700", "Passa", "200", "800", "Swap", "400", "500", "100", "200", "300", "400", "500", "600"];
const SINGLEPLAYER_LAYOUT = ["Bancarotta", "100", "300", "500", "200", "400", "600", "Bancarotta", "100", "300", "500", "200", "400", "600", "700", "800", "100", "200", "300", "500"];
const COLORS = ["#E5243B", "#DDA63A", "#C5192D", "#FF3A21", "#FCC30B", "#FD6925", "#DD1367", "#FD9D24", "#BF8B2E", "#3F7E44", "#0ad9b7ff", "#56C02B", "#51c4fdff", "#19486A", "#8E24AA", "#2E7D32", "#F57C00", "#5D4037", "#37474F", "#6A1B9A"];

export default function Wheel({ onSpin, lastSpin, onSpinEnd, disabled, numPlayers, isSpinning }) {
  const { t } = useTranslation();
  const angRef = useRef(0);
  const angVelRef = useRef(0);
  const [isStopping, setIsStopping] = useState(false);

  const sectors = useMemo(() => {
    const layout = numPlayers > 1 ? MULTIPLAYER_LAYOUT : SINGLEPLAYER_LAYOUT;
    return layout.map((v, i) => ({
      raw: v,
      color: v === "Bancarotta" ? "#000000" : v === "Passa" ? "#1976d2" : v === "Swap" ? "#d025ffff" : COLORS[i % COLORS.length],
      label: v === "Bancarotta" ? t('wheel.bankruptLabel') : v === "Passa" ? t('wheel.pass') : v === "Swap" ? t('wheel.swap') : v
    }));
  }, [numPlayers, t]);

  const sectorsRef = useRef(sectors);
  useEffect(() => { sectorsRef.current = sectors; }, [sectors]);

  const updateButtonText = () => {
    const spinEl = document.getElementById("spin");
    if (!spinEl) return;

    let displayText = "";

    // 1. Durante il movimento (giro o frenata) mostra sempre SPIN
    if (isSpinning || isStopping) {
      displayText = t('wheel.spin'); 
      spinEl.classList.add('spinning');
    } 
    // 2. A ruota ferma, controlliamo il risultato
    else if (lastSpin) {
      // Estraiamo il valore (gestendo sia oggetti che stringhe/numeri)
      const ls = String(typeof lastSpin === 'object' ? lastSpin.value : lastSpin);
      const lsLower = ls.toLowerCase();

      // Mappatura delle icone speciali senza moneta
      if (lsLower === "bancarotta") {
        displayText = "😵‍💫";
      } else if (lsLower === "passa") {
        displayText = "⏭️";
      } else if (lsLower === "scambia") {
        displayText = "🔀";
      } else {
        // Se non è uno dei tre sopra, è un numero: aggiungiamo la moneta
        displayText = `${ls}🪙`;
      }
      
      spinEl.classList.remove('spinning');
    } 
    // 3. Stato iniziale
    else {
      displayText = t('wheel.spin');
      spinEl.classList.remove('spinning');
    }

    spinEl.textContent = displayText;
  };

  useEffect(() => {
    const canvas = document.getElementById("wheel");
    if (!canvas) return;

    if (isSpinning) {
      canvas.style.transition = 'none'; 
      angVelRef.current = 0.15; 
      setIsStopping(false);
    } else if (!isSpinning && lastSpin) {
      angVelRef.current = 0;
      setIsStopping(true);
      
      const val = String(typeof lastSpin === 'object' ? lastSpin.value : lastSpin);
      const norm = (val === "Scambia" || val === t('wheel.swap')) ? 'Swap' : 
                   (val === "Passa" || val === t('wheel.pass')) ? 'Passa' : 
                   (val === "Bancarotta" || val === t('wheel.bankrupt')) ? 'Bancarotta' : val;
      
      const targetIndex = sectorsRef.current.findIndex(s => String(s.raw) === norm);
      const tot = sectorsRef.current.length;
      const TAU = 2 * Math.PI;

      const targetAngleInCircle = (1 - (targetIndex + 0.5) / tot) * TAU;
      const currentAngleInCircle = ((angRef.current % TAU) + TAU) % TAU;
      let distanceToTarget = targetAngleInCircle - currentAngleInCircle;
      if (distanceToTarget <= 0) distanceToTarget += TAU;

      const finalAng = angRef.current + distanceToTarget + (4 * TAU);
      
      canvas.style.transition = `transform 3.5s cubic-bezier(0.15, 0, 0.15, 1)`;
      canvas.style.transform = `rotate(${finalAng}rad)`;

      const onEnd = (ev) => {
        if (ev.target !== canvas) return;
        canvas.removeEventListener('transitionend', onEnd);
        angRef.current = finalAng;
        canvas.style.transition = 'none';
        canvas.style.transform = `rotate(${angRef.current}rad)`;
        
        setIsStopping(false); // Fine corsa: scatterà l'aggiornamento del testo a "Valore"
        if (onSpinEnd) onSpinEnd(lastSpin);
      };
      canvas.addEventListener('transitionend', onEnd);
    }
  }, [isSpinning, lastSpin]);

  useEffect(() => {
    const canvas = document.getElementById("wheel");
    if (!canvas) return;
    canvas.width = 800; canvas.height = 800;
    const ctx = canvas.getContext("2d");
    const rad = canvas.width / 2;
    const arc = (2 * Math.PI) / sectors.length;

    const frame = () => {
      if (isSpinning) {
        angRef.current += angVelRef.current;
        canvas.style.transform = `rotate(${angRef.current}rad)`;
      }
      updateButtonText(); // Chiamato ad ogni frame per gestire i cambi di stato
      rafId = requestAnimationFrame(frame);
    };

    let rafId = requestAnimationFrame(frame);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sectors.forEach((s, i) => {
      const startAng = (arc * i) - (Math.PI / 2);
      ctx.save();
      ctx.beginPath(); ctx.fillStyle = s.color; ctx.moveTo(rad, rad); ctx.arc(rad, rad, rad, startAng, startAng + arc); ctx.fill();
      ctx.translate(rad, rad); ctx.rotate(startAng + arc / 2.65); ctx.rotate(Math.PI);
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = `bold ${Math.floor(rad * 0.08)}px sans-serif`;
      ctx.fillText(s.label, -Math.floor(rad * 0.65), 0);
      ctx.restore();
    });

    return () => cancelAnimationFrame(rafId);
  }, [sectors, isSpinning, isStopping, lastSpin]);

  return (
    <div className="wheel-container">
      <div id="wheelOfFortune" className="wheel-wrapper">
        <canvas id="wheel" className="wheel-canvas" style={{ transform: `rotate(${angRef.current}rad)` }} />
        <button id="spin" className="spin-btn" disabled={disabled || isSpinning || isStopping} onClick={onSpin}>
          {t('wheel.spin')}
        </button>
      </div>
    </div>
  );
}