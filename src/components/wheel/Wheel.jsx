import { useEffect, useRef } from "react";
import "./Wheel.css"; 
import { useTranslation } from '../../i18n/TranslationProvider';

export default function Wheel({ onSpin, lastSpin, onSpinEnd, disabled, numPlayers }) {
  const { t } = useTranslation();
  
  const angRef = useRef(0);
  const angVelRef = useRef(0);
  
  const onSpinRef = useRef(onSpin);
  const lastSpinRef = useRef(lastSpin);
  const onSpinEndRef = useRef(onSpinEnd);

  useEffect(() => { onSpinRef.current = onSpin; }, [onSpin]);
  useEffect(() => { lastSpinRef.current = lastSpin; }, [lastSpin]);
  useEffect(() => { onSpinEndRef.current = onSpinEnd; }, [onSpinEnd]);

  useEffect(() => {
    // 1. Sector Generation
    const baseValues = [
      ...Array(4).fill("100"), ...Array(3).fill("200"),
      ...Array(3).fill("300"), ...Array(2).fill("400"),
      ...Array(2).fill("500"), ...Array(2).fill("600"),
      ...Array(1).fill("700"), ...Array(1).fill("800")
    ];
    const shuffledValues = baseValues.sort(() => Math.random() - 0.5);

    let finalValues;
    if (numPlayers > 1) {
      finalValues = [...shuffledValues];
      const specialPairs = [
        { pos: 0, label: "Bancarotta" }, { pos: 3, label: "Passa" },
        { pos: 7, label: "Bancarotta" }, { pos: 10, label: "Passa" },
        { pos: 5, label: "Swap" }, { pos: 14, label: "Swap" }
      ];
      specialPairs.sort((a, b) => b.pos - a.pos).forEach(p => {
        finalValues.splice(p.pos, 0, p.label);
      });
    } else {
      finalValues = [...shuffledValues];
      const specialPositions = [7, 15].sort((a, b) => b - a);
      specialPositions.forEach((pos) => {
        finalValues.splice(pos, 0, "Bancarotta");
      });
    }
    
    const colorPalette = [
      "#E5243B", "#DDA63A", "#C5192D", "#FF3A21", "#FCC30B",
      "#FD6925", "#DD1367", "#FD9D24", "#BF8B2E", "#3F7E44",
      "#0ad9b7ff", "#56C02B", "#51c4fdff", "#19486A", "#8E24AA",
      "#2E7D32", "#F57C00", "#5D4037", "#37474F", "#6A1B9A"
    ];
    
    const sectors = finalValues.map((value, i) => {
      const color = value === "Bancarotta" ? "#000000" :
                    value === "Passa" ? "#1976d2" :
                    value === "Swap" ? "#d025ffff" :
                    colorPalette[i % colorPalette.length];

      const displayLabel = value === "Bancarotta" ? t('wheel.bankruptLabel') : 
                           value === "Passa" ? t('wheel.pass') : 
                           value === "Swap" ? t('wheel.swap') : value;

      return { raw: value, color, label: displayLabel };
    });

    const canvas = document.getElementById("wheel");
    const spinEl = document.getElementById("spin");
    if (!canvas || !spinEl) return;

    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    const tot = sectors.length;
    const rad = canvas.width / 2;
    const PI = Math.PI;
    const TAU = 2 * PI;
    const arc = TAU / tot;
    const friction = 0.991;

    // 2. Updated Index Logic
    const getIndex = () => {
      const normalizedAng = ((angRef.current % TAU) + TAU) % TAU;
      // We subtract 0.5/tot to ensure we are looking at the center of the sector at the pointer
      return Math.floor(tot - (normalizedAng / TAU) * tot) % tot;
    };

    // 3. Updated Draw Logic (Starting from Top)
    function drawSector(sector, i) {
      // Offset the drawing by -PI/2 so index 0 is at the top
      const startAng = (arc * i) - (PI / 2);
      const angleMid = startAng + arc / 2;
      
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = sector.color;
      ctx.moveTo(rad, rad);
      ctx.arc(rad, rad, rad, startAng, startAng + arc);
      ctx.closePath();
      ctx.fill();
      
      ctx.translate(rad, rad);
      ctx.rotate(angleMid);
      ctx.rotate(PI);
      
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      
      const baseFontSize = Math.floor(rad * 0.085);
      let fontSize = sector.raw === "Bancarotta" ? Math.floor(baseFontSize * 0.85) : baseFontSize;
      ctx.font = `bold ${fontSize}px sans-serif`;
      
      const maxWidth = rad * 0.75;
      while (ctx.measureText(sector.label).width > maxWidth && fontSize > 10) {
        fontSize -= 1;
        ctx.font = `bold ${fontSize}px sans-serif`;
      }
      ctx.fillText(sector.label, -Math.floor(rad * 0.65), 0);
      ctx.restore();
    }

    function rotate() {
      const sector = sectors[getIndex()];
      const isSpinning = !!angVelRef.current || canvas.classList.contains('css-spinning');
      
      // Removed the PI/2 offset here so 0rad is the visual starting state
      canvas.style.setProperty('--wheel-rotation', `${angRef.current}rad`);
      
      let displayText;
      if (isSpinning) {
        const isSwap = sector.raw === "Swap" || sector.raw === t('wheel.swap');
        displayText = sector.raw === "Bancarotta" ? "😵‍💫" : 
                      sector.raw === "Passa" ? "⏭️" : 
                      isSwap ? "🔀" : sector.label;
      } else if (lastSpinRef.current) {
        const ls = String(lastSpinRef.current);
        if (ls === "Bancarotta" || ls === t('wheel.bankrupt')) displayText = "😵‍💫";
        else if (ls === "Passa" || ls === t('wheel.pass')) displayText = "⏭️";
        else if (ls === "Swap" || ls === t('wheel.swap')) displayText = "🔀";
        else displayText = `${ls}🪙`;
      } else {
        displayText = t('wheel.spin');
      }
      
      spinEl.textContent = displayText;
      spinEl.setAttribute('data-sector-color', sector.color);
      spinEl.classList.toggle('spinning', isSpinning);
    }

    function frame() {
      if (!angVelRef.current) return;
      angVelRef.current *= friction;
      if (angVelRef.current < 0.002) angVelRef.current = 0;
      angRef.current += angVelRef.current;
      rotate();
    }

    let rafId = 0;
    let engineRunning = true;
    function engine() {
      frame();
      if (engineRunning) rafId = requestAnimationFrame(engine);
    }

    const startSpinVisual = (targetIndex, spinResult) => {
      engineRunning = false;
      canvas.classList.add('css-spinning');

      const totalFullTurns = 4;
      
      // Since we draw starting at Top, 0rad = index 0 at top.
      const targetAngleInCircle = (1 - (targetIndex + 0.5) / tot) * TAU;
      const currentAngleInCircle = ((angRef.current % TAU) + TAU) % TAU;
      
      let distanceToTarget = targetAngleInCircle - currentAngleInCircle;
      if (distanceToTarget <= 0) distanceToTarget += TAU;

      const finalAng = angRef.current + distanceToTarget + (totalFullTurns * TAU);
      const duration = 3000 + Math.floor(Math.random() * 1000);

      canvas.style.transition = `transform ${duration}ms cubic-bezier(0.1, 0, 0.1, 1)`;
      canvas.style.transform = `rotate(${finalAng}rad)`;

      const onTransitionEnd = (ev) => {
        if (ev.target !== canvas) return;
        canvas.removeEventListener('transitionend', onTransitionEnd);
        
        angRef.current = finalAng;
        canvas.style.transition = '';
        canvas.style.transform = `rotate(${angRef.current}rad)`;
        canvas.classList.remove('css-spinning');
        
        engineRunning = true;
        engine();
        if (onSpinEndRef.current) onSpinEndRef.current(spinResult);
      };

      canvas.addEventListener('transitionend', onTransitionEnd);
    };

    const onSpinClick = () => {
      if (canvas.classList.contains('css-spinning') || angVelRef.current) return;

      if (typeof onSpinRef.current === 'function') {
        const res = onSpinRef.current();
        const handleResult = (spinResult) => {
          if (!spinResult) return;
          const val = String(spinResult.value);
          const norm = (val === t('wheel.swap')) ? 'Swap' : (val === t('wheel.pass')) ? 'Passa' : (val === t('wheel.bankrupt')) ? 'Bancarotta' : val;
          const targetIndex = sectors.findIndex(s => String(s.raw) === norm);
          startSpinVisual(targetIndex >= 0 ? targetIndex : Math.floor(Math.random() * tot), spinResult);
        };

        if (res instanceof Promise) {
          res.then(handleResult).catch(() => { angVelRef.current = 0.4; });
        } else {
          handleResult(res);
        }
      } else {
        angVelRef.current = 0.4;
      }
    };

    sectors.forEach(drawSector);
    // Apply exact current rotation (initially 0rad) without the offset
    canvas.style.transform = `rotate(${angRef.current}rad)`;
    rotate();
    engine();

    spinEl.addEventListener("click", onSpinClick);
    return () => {
      engineRunning = false;
      cancelAnimationFrame(rafId);
      spinEl.removeEventListener("click", onSpinClick);
    };
  }, [numPlayers, t]);

  return (
    <div className="wheel-container">
      <div id="wheelOfFortune" className="wheel-wrapper">
        <canvas id="wheel" className="wheel-canvas" />
        <button id="spin" className="spin-btn" disabled={disabled}>
          {t('wheel.spin') || 'SPIN'}
        </button>
      </div>
    </div>
  );
}