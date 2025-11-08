import { useEffect, useRef } from "react";
import "./Wheel.css"; // import CSS
import { useTranslation } from '../../i18n/TranslationProvider';

export default function Wheel({ onSpin, lastSpin, onSpinEnd, disabled, numPlayers }) {
  const { t } = useTranslation();
  // Keep a ref to the latest onSpin so the init effect can run once
  const onSpinRef = useRef(onSpin);
  // Keep a ref to the latest lastSpin so closures can read the up-to-date value
  const lastSpinRef = useRef(lastSpin);
  const onSpinEndRef = useRef(onSpinEnd);

  // Update the ref whenever the prop changes
  useEffect(() => {
    onSpinRef.current = onSpin;
  }, [onSpin]);

  // Update lastSpin ref whenever parent changes it
  useEffect(() => {
    lastSpinRef.current = lastSpin;
  }, [lastSpin]);

  // Update onSpinEnd ref
  useEffect(() => { onSpinEndRef.current = onSpinEnd }, [onSpinEnd])

  useEffect(() => {
  // Generate base values without "Bancarotta" and "Passa"
    const baseValues = [
      ...Array(4).fill("100"),
      ...Array(3).fill("200"),
      ...Array(3).fill("300"),
      ...Array(2).fill("400"),
      ...Array(2).fill("500"),
      ...Array(2).fill("600"),
      ...Array(1).fill("700"),
      ...Array(1).fill("800")
    ];
  // Shuffle base values
    const shuffledValues = baseValues.sort(() => Math.random() - 0.5);

    let finalValues;
    if (numPlayers > 1) {
      // Choose the first position for "Bancarotta"
      const firstBankruptcyPos = 0;
      // Choose the first position for "Passa" far from bankruptcies
      const firstPassaPos = 3;
      // Choose the second position for "Bancarotta" far from the first
      const secondBankruptcyPos = 7;
      // Choose the second position for "Passa" far from the first two
      const secondPassaPos = 10;
      // Choose the third position for "Bancarotta" far from the first two
      const thirdBankruptcyPos = 14;
      // Choose the third position for "Passa" far from the first two
      const thirdPassaPos = 17;
      // Insert special values in the calculated positions
      // Create pos/label pairs to alternate Bancarotta/Passa
      finalValues = [...shuffledValues];
      const specialPairs = [
        { pos: firstBankruptcyPos, label: "Bancarotta" },
        { pos: firstPassaPos, label: "Passa" },
        { pos: secondBankruptcyPos, label: "Bancarotta" },
        { pos: secondPassaPos, label: "Passa" },
        { pos: thirdBankruptcyPos, label: "Bancarotta" },
        { pos: thirdPassaPos, label: "Passa" }
      ];
      // Sort by descending index before splice to avoid index shifting
      specialPairs.sort((a, b) => b.pos - a.pos).forEach(p => {
        finalValues.splice(p.pos, 0, p.label);
      });
    } else {
      // Choose the first position for "Bancarotta"
      const firstBankruptcyPos = 7;
      // Choose the second position for "Bancarotta" far from the first
      const secondBankruptcyPos = 15;
      finalValues = [...shuffledValues];
      const specialPositions = [firstBankruptcyPos, secondBankruptcyPos].sort((a, b) => b - a);
      const specialLabels = ["Bancarotta", "Bancarotta"];
      specialPositions.forEach((pos, i) => {
        finalValues.splice(pos, 0, specialLabels[i]);
      });
    }
    
    const colorPalette = [
      "#E5243B",
      "#DDA63A", 
      "#C5192D",
      "#FF3A21",
      "#FCC30B",
      "#FD6925",
      "#DD1367",
      "#FD9D24",
      "#BF8B2E",
      "#3F7E44",
      "#0A97D9",
      "#56C02B",
      "#00689D",
      "#19486A",
      "#8E24AA",
      "#2E7D32",
      "#F57C00",
      "#5D4037",
      "#37474F",
      "#6A1B9A"
    ];
    
  // Build sectors with raw value and a translated/display label
    const sectors = finalValues.map((value, i) => {
      const color = value === "Bancarotta" ? "#000000" : value === "Passa" ? "#1976d2" : colorPalette[i % colorPalette.length];
      const displayLabel = value === "Bancarotta"
        ? (t('wheel.bankruptLabel') || 'BANCAROTTA').toUpperCase()
        : value === "Passa"
        ? (t('wheel.pass') || 'Pass')
        : value;
      return { raw: value, color, label: displayLabel };
    });

  const canvas = document.getElementById("wheel");
  const spinEl = document.getElementById("spin");

  if (!canvas || !spinEl) return;

  // Use 360x360 canvas for a more compact display
  canvas.width = 360;
  canvas.height = 360;

    const rand = (m, M) => Math.random() * (M - m) + m;
    const tot = sectors.length;
    const ctx = canvas.getContext("2d");
  // Remove inline styles, use CSS classes instead
  ctx.canvas.classList.add('wheel-canvas');
    const dia = ctx.canvas.width;
    const rad = dia / 2;
    const PI = Math.PI;
    const TAU = 2 * PI;
    const arc = TAU / sectors.length;

    const friction = 0.991;
    let angVel = 0;
    let ang = 0;

    const getIndex = () => Math.floor(tot - (ang / TAU) * tot) % tot;

    function drawSector(sector, i) {
      const ang = arc * i;
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = sector.color;
      ctx.moveTo(rad, rad);
      ctx.arc(rad, rad, rad, ang, ang + arc);
      ctx.lineTo(rad, rad);
      ctx.fill();
      ctx.translate(rad, rad);
      ctx.rotate(ang + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      // Use smaller font for bankrupt text, normal for numbers
      if (sector.raw === "Bancarotta") {
        ctx.font = "bold 10px sans-serif";
      } else {
        ctx.font = "bold 14px sans-serif";
      }
      ctx.fillText(sector.label, rad - 10, 10);
      ctx.restore();
    }

    function rotate() {
      const sector = sectors[getIndex()];
      // Debug: report current angle and angular velocity
      console.log('rotate() ang(rad):', ang, 'angVel:', angVel, 'sector:', sector.label);
      ctx.canvas.setAttribute('data-rotation', ang - PI / 2); // for debugging/testing
      ctx.canvas.style.setProperty('--wheel-rotation', `${ang - PI / 2}rad`);
      ctx.canvas.classList.add('wheel-rotating');
      const isSpinning = !!angVel;
      // When spinning show the current sector, otherwise show the latest value from parent (if any)
      let displayText;
      if (isSpinning) {
        // During spin, show emoji if the sector is Bancarotta or Passa
        displayText = sector.raw === "Bancarotta" ? "😵‍💫" : sector.raw === "Passa" ? "🔄" : sector.label;
      } else if (lastSpinRef.current) {
        if (lastSpinRef.current === "Bancarotta") displayText = "😵‍💫";
        else if (lastSpinRef.current === "Passa") displayText = "🔄";
        else displayText = `${lastSpinRef.current} €`;
      } else {
        displayText = t('wheel.spin') || 'SPIN';
      }
      spinEl.textContent = displayText;
      spinEl.setAttribute('data-sector-color', sector.color);
      spinEl.classList.toggle('spinning', isSpinning);
    }

    function frame() {
      // Debug: show that frame is running and current angVel
      if (angVel) console.log('frame running angVel:', angVel);
      if (!angVel) return;
      angVel *= friction;
      if (angVel < 0.002) angVel = 0;
      ang += angVel;
      ang %= TAU;
      rotate();
    }

    let rafId = 0;
    let engineRunning = true;
    function engine() {
      frame();
      if (engineRunning) rafId = requestAnimationFrame(engine);
    }

    function init() {
      sectors.forEach(drawSector);
      rotate();
      engine();

      // This flag marks when we animate via CSS transition to land on specific sector
      let cssSpinning = false;

      const onSpinClick = () => {
        console.log('spin button clicked, angVel before:', angVel);
        if (cssSpinning) { console.log('CSS spin in progress, ignore click'); return }
        if (angVel) { console.log('ignored: already spinning by physics'); return }

        // Add some random variation to starting angle to make each spin look different
        const startAngleVariation = Math.random() * 0.5; // Small random starting variation
        ang += startAngleVariation;
        ang %= TAU;
        rotate(); // Update display with new starting position

        const startSpinVisual = (targetIndex, spinResult) => {
          // Stop the RAF-driven engine while CSS animation runs
          engineRunning = false;
          cssSpinning = true;

          // Add much more randomness to the rotation but keep precision
          const extraSpins = 8 + Math.floor(Math.random() * 8); // 8..15 spins for more variation
          // Keep precise center positioning but add full rotations for randomness
          const additionalFullRotations = Math.floor(Math.random() * 4); // 0-3 additional full rotations
          // Center of target sector: (targetIndex + 0.5)/tot - NO random offset to maintain precision
          const targetPosition = (targetIndex + 0.5) / tot;
          // Calculate final angle from current angle to ensure precise landing
          const currentAngle = ang % TAU;
          const targetAngle = TAU * (1 - targetPosition);
          // Calculate the shortest path to target, then add the extra spins
          let angleDifference = targetAngle - currentAngle;
          if (angleDifference < 0) angleDifference += TAU;
          const finalAng = currentAngle + (extraSpins + additionalFullRotations) * TAU + angleDifference;
          // Vary duration more significantly
          const duration = 2000 + Math.floor(Math.random() * 2000); // 2s to 4s for more variation

          // Attach transitionend to canvas
          const onTransitionEnd = (ev) => {
            ctx.canvas.removeEventListener('transitionend', onTransitionEnd);
            // Normalize angle
            ang = finalAng % TAU;
            // Clear CSS transition so future RAF updates can control transform
            ctx.canvas.style.transition = '';
            // Ensure final transform applied
            ctx.canvas.setAttribute('data-rotation', ang - PI / 2);
            ctx.canvas.style.setProperty('--wheel-rotation', `${ang - PI / 2}rad`);
            ctx.canvas.classList.add('wheel-rotating');
            cssSpinning = false;
            // Resume RAF engine to keep UI consistent (but angVel is zero)
            engineRunning = true;
            engine();
            // Notify parent that spin finished
            try { if (onSpinEndRef.current) onSpinEndRef.current(spinResult); } catch(e){ console.error('onSpinEnd threw', e) }
          };

          // Start CSS transition with varied easing
          const easingVariations = [
            'cubic-bezier(.2,.8,.2,1)',
            'cubic-bezier(.1,.7,.3,1)',
            'cubic-bezier(.25,.46,.45,.94)',
            'cubic-bezier(.165,.84,.44,1)'
          ];
          const randomEasing = easingVariations[Math.floor(Math.random() * easingVariations.length)];
          ctx.canvas.style.transition = `transform ${duration}ms ${randomEasing}`;
          // force repaint
          // @ts-ignore
          void ctx.canvas.offsetWidth;
          ctx.canvas.addEventListener('transitionend', onTransitionEnd);
          // apply final transform
          ctx.canvas.style.transform = `rotate(${finalAng - PI / 2}rad)`;

          // Keep button text as the localized "spin" text during spinning instead of showing dots
          spinEl.textContent = t('wheel.spin') || 'SPIN';
        };

        const startSpinFallback = () => { 
          // Add more variation to the fallback angular velocity
          angVel = rand(0.2, 0.6); // Increased range from 0.25-0.45 to 0.2-0.6
          console.log('starting fallback spin, angVel:', angVel); 
        };

        if (typeof onSpinRef.current === 'function') {
          try {
            const res = onSpinRef.current();
            if (res && typeof res.then === 'function') {
              // Awaiting server-side chosen value
              res.then((spinResult) => {
                if (!spinResult) {
                  console.log('onSpin resolved falsy, abort spin');
                  return;
                }
                const val = spinResult.value;
                let targetIndex;
                if (val === "Bancarotta") {
                  targetIndex = sectors.findIndex(s => s.raw === "Bancarotta");
                } else if (val === "Passa") {
                  targetIndex = sectors.findIndex(s => s.raw === "Passa");
                } else {
                  targetIndex = sectors.findIndex(s => s.raw === String(val));
                }
                startSpinVisual(targetIndex >= 0 ? targetIndex : Math.floor(Math.random()*tot), spinResult);
              }).catch((e) => { console.log('onSpin promise rejected', e); startSpinFallback(); });
            } else if (res) {
              const spinResult = res;
              const val = spinResult.value;
              let targetIndex;
              if (val === "Bancarotta") {
                targetIndex = sectors.findIndex(s => s.raw === "Bancarotta");
              } else if (val === "Passa") {
                targetIndex = sectors.findIndex(s => s.raw === "Passa");
              } else {
                targetIndex = sectors.findIndex(s => s.raw === String(val));
              }
              startSpinVisual(targetIndex >= 0 ? targetIndex : Math.floor(Math.random()*tot), spinResult);
            } else {
              console.log('onSpin returned falsy non-promise', res);
            }
          } catch (e) {
            console.log('onSpin threw', e);
            // If onSpin throws, do not start the spin
          }
        } else {
          startSpinFallback();
        }
      };

      spinEl.addEventListener("click", onSpinClick);

      // Cleanup when unmounting: remove listener and stop RAF
      const cleanup = () => {
        spinEl.removeEventListener("click", onSpinClick);
        if (rafId) cancelAnimationFrame(rafId);
        engineRunning = false;
      };

      // Attach cleanup to element for outer scope removal if needed
      // Not the most React-ish but keeps the code simple in this vanilla DOM implementation
      // Store on the element so the outer effect cleanup can call it
      // @ts-ignore
      spinEl._cleanup = cleanup;
    }

    init();

    return () => {
      // Call cleanup if set
      if (spinEl && spinEl._cleanup) try { spinEl._cleanup(); } catch (e) {}
    };
  }, [numPlayers, t]);

  // Update button text when parent lastSpin changes (so the button shows the latest value when not spinning)
  useEffect(() => {
    const spinEl = document.getElementById("spin");
    if (!spinEl) return;
    if (!lastSpin) {
      spinEl.textContent = t('wheel.spin') || "SPIN";
    } else {
      if (lastSpin === "Bancarotta") spinEl.textContent = "😵‍💫";
      else if (lastSpin === "Passa") spinEl.textContent = "🔄";
      else spinEl.textContent = `${lastSpin} €`;
    }
  }, [lastSpin, t]);

    return (
    <div className="wheel-container">
        <div id="wheelOfFortune" className="wheel-wrapper">
        <canvas id="wheel" className="wheel-canvas" />
        <button id="spin" className="spin-btn" disabled={disabled}>{t('wheel.spin') || 'SPIN'}</button>
        </div>
      </div>
    );
}
