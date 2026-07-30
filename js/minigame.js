// Tunable constants – adjust to taste
export const MINIGAME_CONFIG = {
  maxDuration: 2000,  // ms before auto-stop
  maxTurns: 2,        // full rotations before stop
  okZoneBase: 110,    // degrees of OK zone at efficiency = 1
  okZoneMin: 18,      // degrees of OK zone at efficiency = 0
};

const CX = 140, CY = 140, R = 108, CANVAS_SIZE = 280;

// Game angles: 0° = top (12 o'clock), clockwise positive
// Canvas angles: 0 = right (3 o'clock), clockwise positive
// Conversion: canvas_rad = (gameDeg - 90) * PI / 180
function toRad(gameDeg) {
  return (gameDeg - 90) * Math.PI / 180;
}

// OK zone is centered at the bottom (180°) so needle starts top and must travel far
function computeZones(efficiency) {
  const okAngle = MINIGAME_CONFIG.okZoneMin +
    efficiency * (MINIGAME_CONFIG.okZoneBase - MINIGAME_CONFIG.okZoneMin);
  const failZoneAngle = 360 - okAngle;
  const penaltyAngle = failZoneAngle * 0.1;
  return {
    halfOk: okAngle / 2,
    halfPenalty: penaltyAngle / 2,
  };
}

function drawZones(ctx, halfOk, halfPenalty) {
  const stroke = (startDeg, endDeg, color) => {
    ctx.beginPath();
    ctx.arc(CX, CY, R, toRad(startDeg), toRad(endDeg), false);
    ctx.strokeStyle = color;
    ctx.lineWidth = 30;
    ctx.stroke();
  };

  // Fail zone wraps through top: from (180+halfOk+halfPenalty) clockwise to (180-halfOk-halfPenalty)
  stroke(180 + halfOk + halfPenalty, 180 - halfOk - halfPenalty, '#8b2020');
  // Penalty flanks
  stroke(180 - halfOk - halfPenalty, 180 - halfOk, '#c8821e');
  stroke(180 + halfOk, 180 + halfOk + halfPenalty, '#c8821e');
  // OK zone
  stroke(180 - halfOk, 180 + halfOk, '#1e8b42');
}

function drawFrame(ctx, angleDeg, halfOk, halfPenalty) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Background ring
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, 2 * Math.PI);
  ctx.strokeStyle = '#2c2c4a';
  ctx.lineWidth = 30;
  ctx.stroke();

  drawZones(ctx, halfOk, halfPenalty);

  // Mask inner fill so it looks like a ring
  ctx.beginPath();
  ctx.arc(CX, CY, R - 16, 0, 2 * Math.PI);
  ctx.fillStyle = '#12121e';
  ctx.fill();

  // Tick mark at OK center (bottom)
  const tickRad = toRad(180);
  const tickInner = R - 14;
  const tickOuter = R + 14;
  ctx.beginPath();
  ctx.moveTo(CX + tickInner * Math.cos(tickRad), CY + tickInner * Math.sin(tickRad));
  ctx.lineTo(CX + tickOuter * Math.cos(tickRad), CY + tickOuter * Math.sin(tickRad));
  ctx.strokeStyle = '#a0ffa0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Needle
  const rad = toRad(angleDeg);
  ctx.beginPath();
  ctx.moveTo(CX - 12 * Math.cos(rad), CY - 12 * Math.sin(rad));
  ctx.lineTo(CX + (R - 3) * Math.cos(rad), CY + (R - 3) * Math.sin(rad));
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(CX, CY, 7, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

function getMultiplier(normalizedDeg, halfOk, halfPenalty) {
  if (normalizedDeg >= 180 - halfOk && normalizedDeg <= 180 + halfOk) return 1;
  if (
    (normalizedDeg >= 180 - halfOk - halfPenalty && normalizedDeg < 180 - halfOk) ||
    (normalizedDeg > 180 + halfOk && normalizedDeg <= 180 + halfOk + halfPenalty)
  ) return 0.5;
  return 0;
}

export function runMiniGame(efficiency) {
  return new Promise((resolve) => {
    const { halfOk, halfPenalty } = computeZones(efficiency);

    // --- Build modal DOM ---
    const overlay = document.createElement('div');
    overlay.className = 'minigame-overlay';

    const modal = document.createElement('div');
    modal.className = 'minigame-modal';

    const title = document.createElement('p');
    title.className = 'minigame-title';
    title.textContent = 'ACTION CHECK';

    const subtitle = document.createElement('p');
    subtitle.className = 'minigame-subtitle';
    subtitle.textContent = `Efficiency ${(efficiency * 100).toFixed(0)}% — click to stop the needle`;

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    canvas.className = 'minigame-canvas';

    const hint = document.createElement('p');
    hint.className = 'minigame-hint';
    hint.textContent = 'green = hit · orange = partial · red = miss';

    const resultLabel = document.createElement('p');
    resultLabel.className = 'minigame-result';
    resultLabel.textContent = '\u00a0';

    modal.append(title, subtitle, canvas, hint, resultLabel);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const ctx = canvas.getContext('2d');
    const totalDeg = MINIGAME_CONFIG.maxTurns * 360;
    const startTime = performance.now();
    let stopped = false;
    let animId;

    function angleAt(elapsed) {
      return (Math.min(elapsed, MINIGAME_CONFIG.maxDuration) / MINIGAME_CONFIG.maxDuration) * totalDeg;
    }

    function stop(elapsed) {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(animId);

      const angle = angleAt(elapsed);
      const normalized = ((angle % 360) + 360) % 360;
      const multiplier = getMultiplier(normalized, halfOk, halfPenalty);

      drawFrame(ctx, angle % 360, halfOk, halfPenalty);

      if (multiplier === 1) {
        resultLabel.textContent = '✓ HIT — full power';
        resultLabel.dataset.outcome = 'hit';
      } else if (multiplier === 0.5) {
        resultLabel.textContent = '~ PARTIAL — 50% power';
        resultLabel.dataset.outcome = 'partial';
      } else {
        resultLabel.textContent = '✗ MISS — action failed';
        resultLabel.dataset.outcome = 'miss';
      }

      setTimeout(() => {
        overlay.remove();
        resolve(multiplier);
      }, 700);
    }

    function animate(timestamp) {
      const elapsed = timestamp - startTime;
      if (elapsed >= MINIGAME_CONFIG.maxDuration) {
        stop(MINIGAME_CONFIG.maxDuration);
        return;
      }
      drawFrame(ctx, angleAt(elapsed) % 360, halfOk, halfPenalty);
      animId = requestAnimationFrame(animate);
    }

    canvas.addEventListener('click', () => stop(performance.now() - startTime));

    animId = requestAnimationFrame(animate);
  });
}
