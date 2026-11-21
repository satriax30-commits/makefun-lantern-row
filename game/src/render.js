// Drawing only: the world's state and the current screen in, pixels out. The 1280x720
// playfield is scaled to fit the window and centred, the margin filled with the backdrop
// colour. The two panels are painted once per scene into offscreen canvases and reused;
// markers, the HUD and the overlays are drawn fresh every frame.
import { FIELD, FONT, HINTS_PER_SCENE, MARK_POP_SECONDS, PALETTE, PANEL } from './config.js';
import { PANEL_H, PANEL_W, SCENES, renderPanel } from './scene.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

/** The hint button in the HUD, and the next-scene button on the win screen. */
export const HINT_BTN = { x: 1060, y: 14, w: 96, h: 46 };
export const NEXT_BTN = { x: 540, y: 452, w: 200, h: 54 };
export const RETRY_BTN = { x: 540, y: 452, w: 200, h: 54 };

const HUD_H = 76;
const BOTTOM_Y = 604;

function pointIn(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function inHintButton(x, y) {
  return pointIn(HINT_BTN, x, y);
}
export function inNextButton(x, y) {
  return pointIn(NEXT_BTN, x, y);
}
export function inRetryButton(x, y) {
  return pointIn(RETRY_BTN, x, y);
}

/** Which panel a logical point falls in: 0 left, 1 right, -1 neither; plus panel-local xy. */
export function panelAt(x, y) {
  if (y < PANEL.y || y > PANEL.y + PANEL.height) return { side: -1, x: 0, y: 0 };
  if (x >= PANEL.leftX && x <= PANEL.leftX + PANEL.width) {
    return { side: 0, x: x - PANEL.leftX, y: y - PANEL.y };
  }
  if (x >= PANEL.rightX && x <= PANEL.rightX + PANEL.width) {
    return { side: 1, x: x - PANEL.rightX, y: y - PANEL.y };
  }
  return { side: -1, x: 0, y: 0 };
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  // One painted pair of panels per scene, built lazily and kept for the visit.
  const panels = SCENES.map(() => [null, null]);

  function panelImages(sceneIndex) {
    const pair = panels[sceneIndex % SCENES.length];
    if (pair[0] === null) {
      pair[0] = renderPanel(sceneIndex, 0);
      pair[1] = renderPanel(sceneIndex, 1);
    }
    return pair;
  }

  function fit() {
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    const ox = (canvas.width - FIELD.width * scale) / 2;
    const oy = (canvas.height - FIELD.height * scale) / 2;
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
  }

  function text(str, x, y, size, color, align = 'left', weight = '600') {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y);
  }

  function button(rect, label, enabled, hover) {
    ctx.fillStyle = !enabled ? '#232838' : hover ? PALETTE.buttonHover : PALETTE.button;
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fill();
    ctx.strokeStyle = PALETTE.hudLine;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 17, enabled ? PALETTE.text : PALETTE.muted, 'center');
  }

  function marker(x, y, r, pop, time) {
    // A green ring that pops in, with a check mark inside.
    const s = Math.min(1, Math.max(0.2, pop));
    const radius = r * (0.72 + 0.28 * s);
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = PALETTE.good;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.good;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.38, y);
    ctx.lineTo(x - r * 0.1, y + r * 0.3);
    ctx.lineTo(x + r * 0.42, y - r * 0.3);
    ctx.stroke();
    ctx.restore();
    void time;
  }

  function drawHud(state, screen, best, hover) {
    ctx.fillStyle = PALETTE.hud;
    ctx.fillRect(0, 0, FIELD.width, HUD_H);
    ctx.fillStyle = PALETTE.hudLine;
    ctx.fillRect(0, HUD_H - 2, FIELD.width, 2);

    text('LANTERN ROW', 20, 26, 24, PALETTE.accent, 'left', '800');
    text('Spot the Difference', 20, 54, 14, PALETTE.muted, 'left', '500');

    const scene = SCENES[state.sceneIndex % SCENES.length];
    const found = state.found.filter(Boolean).length;
    const total = scene.diffs.length;
    text(`${scene.name}`, 330, 26, 19, PALETTE.text, 'left', '700');
    text(`Found ${found} of ${total}`, 330, 54, 15, found === total ? PALETTE.good : PALETTE.muted, 'left', '600');

    // One dot per difference: filled green when found.
    for (let i = 0; i < total; i += 1) {
      const dx = 560 + i * 22;
      ctx.fillStyle = state.found[i] ? PALETTE.good : '#3a4470';
      ctx.beginPath();
      ctx.arc(dx, 26, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // The clock: a bar and the seconds, red under half a minute.
    const low = state.timeLeft < 30;
    const mins = Math.floor(state.timeLeft / 60);
    const secs = Math.floor(state.timeLeft % 60);
    text(`${mins}:${String(secs).padStart(2, '0')}`, 760, 26, 22, low ? PALETTE.bad : PALETTE.text, 'left', '700');
    ctx.fillStyle = '#232838';
    ctx.fillRect(760, 46, 180, 10);
    ctx.fillStyle = low ? PALETTE.bad : PALETTE.accent;
    ctx.fillRect(760, 46, 180 * Math.max(0, state.timeLeft / 150), 10);

    text(`Score ${state.score}`, 960, 26, 16, PALETTE.text, 'left', '600');
    text(`Best ${best}`, 960, 52, 13, PALETTE.muted, 'left', '500');

    if (screen === SCREEN_PLAY) {
      const enabled = state.hintsLeft > 0;
      button(HINT_BTN, `Hint (${state.hintsLeft})`, enabled, hover.x >= HINT_BTN.x && hover.x <= HINT_BTN.x + HINT_BTN.w && hover.y >= HINT_BTN.y && hover.y <= HINT_BTN.y + HINT_BTN.h);
    }
  }

  function drawPanels(state, time) {
    const pair = panelImages(state.sceneIndex);
    const scene = SCENES[state.sceneIndex % SCENES.length];
    const allFound = state.found.every(Boolean);
    for (let side = 0; side < 2; side += 1) {
      const px = side === 0 ? PANEL.leftX : PANEL.rightX;
      ctx.fillStyle = allFound ? PALETTE.panelFrameFound : PALETTE.panelFrame;
      ctx.fillRect(px - 4, PANEL.y - 4, PANEL.width + 8, PANEL.height + 8);
      ctx.drawImage(pair[side], px, PANEL.y);
      text(side === 0 ? 'A' : 'B', px + 14, PANEL.y + 20, 18, 'rgba(244,241,230,0.85)', 'left', '800');
      // Markers for every difference already found, on both pictures.
      for (let i = 0; i < scene.diffs.length; i += 1) {
        if (!state.found[i]) continue;
        const d = scene.diffs[i];
        const pop = (state.elapsed - state.foundAt[i]) / MARK_POP_SECONDS;
        marker(px + d.x, PANEL.y + d.y, d.r, pop, time);
      }
      // A pulsing ring around the hinted difference, while the hint lasts.
      if (state.hintIndex >= 0 && state.elapsed < state.hintUntil) {
        const d = scene.diffs[state.hintIndex];
        const pulse = 1 + 0.18 * Math.sin(time * 6);
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = PALETTE.accent;
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.arc(px + d.x, PANEL.y + d.y, d.r * pulse + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      // The red cross where a wrong click just landed, on the panel it landed on.
      if (state.wrong && state.elapsed < state.wrong.until) {
        const w = state.wrong;
        const wx = px + w.x;
        const wy = PANEL.y + w.y;
        ctx.save();
        ctx.strokeStyle = PALETTE.bad;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(wx - 12, wy - 12);
        ctx.lineTo(wx + 12, wy + 12);
        ctx.moveTo(wx + 12, wy - 12);
        ctx.lineTo(wx - 12, wy + 12);
        ctx.stroke();
        ctx.restore();
      }
    }
    // The gap between the pictures carries the "vs" badge.
    circleBadge();
  }

  function circleBadge() {
    const cx = (PANEL.leftX + PANEL.width + PANEL.rightX) / 2;
    const cy = PANEL.y + PANEL.height / 2;
    ctx.fillStyle = PALETTE.hud;
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    text('VS', cx, cy + 1, 15, PALETTE.accent, 'center', '800');
  }

  function drawBottom(state, message) {
    const scene = SCENES[state.sceneIndex % SCENES.length];
    ctx.fillStyle = PALETTE.hud;
    ctx.fillRect(0, BOTTOM_Y, FIELD.width, FIELD.height - BOTTOM_Y);
    ctx.fillStyle = PALETTE.hudLine;
    ctx.fillRect(0, BOTTOM_Y, FIELD.width, 2);
    text(scene.tagline, 20, BOTTOM_Y + 24, 16, PALETTE.text, 'left', '600');
    text(message, 20, BOTTOM_Y + 52, 14, PALETTE.muted, 'left', '500');
    text('Click a difference on either picture  •  H hint  •  P pause', 900, BOTTOM_Y + 52, 13, PALETTE.muted, 'left', '500');
  }

  function overlay(title, lines, prompt, promptY = 452) {
    ctx.fillStyle = PALETTE.overlay;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.hud;
    ctx.beginPath();
    ctx.roundRect(340, 130, 600, 380, 18);
    ctx.fill();
    ctx.strokeStyle = PALETTE.accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(title, 640, 190, 34, PALETTE.accent, 'center', '800');
    let y = 250;
    for (const lineText of lines) {
      text(lineText, 640, y, 18, PALETTE.text, 'center', '500');
      y += 34;
    }
    text(prompt, 640, promptY, 16, PALETTE.muted, 'center', '600');
  }

  function draw(state, screen, best, hover, time, message, winBonus) {
    resize();
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    fit();
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    drawHud(state, screen, best, hover);
    if (screen === SCREEN_TITLE) {
      // The title shows the first scene behind the panel, unplayed.
      drawPanels(state, time);
      overlay(
        'LANTERN ROW',
        [
          'Two pictures, side by side — almost the same.',
          'Find all 7 differences. Click one on either picture.',
          'Three scenes: Lantern Street, Garden Pond, Bakery Window.',
          '150 seconds a scene. A wrong click costs 3 seconds.',
          `Best score so far: ${best}`,
        ],
        'Click or press Space to start',
      );
      return;
    }
    drawPanels(state, time);
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
      drawBottom(state, message);
      if (screen === SCREEN_PAUSED) {
        overlay('Paused', ['Take a breath. The clock is waiting.'], 'Press P or Space to keep hunting');
      }
      return;
    }
    if (screen === SCREEN_WIN) {
      const scene = SCENES[state.sceneIndex % SCENES.length];
      drawBottom(state, 'Scene complete — every difference found.');
      overlay(
        'Scene complete!',
        [
          `${scene.name} — all 7 differences found.`,
          `Scene score ${state.sceneScore}${winBonus > 0 ? ` (includes +${winBonus} time bonus)` : ''}.`,
          `Total score ${state.score}. ${state.cleared} of 3 scenes cleared.`,
        ],
        'Click Next scene or press N',
        424,
      );
      button(NEXT_BTN, 'Next scene →', true, hover.x >= NEXT_BTN.x && hover.x <= NEXT_BTN.x + NEXT_BTN.w && hover.y >= NEXT_BTN.y && hover.y <= NEXT_BTN.y + NEXT_BTN.h);
      return;
    }
    // SCREEN_OVER
    const scene = SCENES[state.sceneIndex % SCENES.length];
    const found = state.found.filter(Boolean).length;
    drawBottom(state, 'Out of time — the differences keep their secrets.');
    overlay(
      "Time's up!",
      [
        `${scene.name} — you found ${found} of ${scene.diffs.length}.`,
        `Score ${state.score}. Best ${best}.`,
      ],
      'Click or press Space to try this scene again',
      424,
    );
    button(RETRY_BTN, 'Try again', true, hover.x >= RETRY_BTN.x && hover.x <= RETRY_BTN.x + RETRY_BTN.w && hover.y >= RETRY_BTN.y && hover.y <= RETRY_BTN.y + RETRY_BTN.h);
  }

  return { draw };
}
