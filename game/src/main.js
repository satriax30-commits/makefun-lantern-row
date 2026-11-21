// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between five screens: title, play, paused, scene complete and
// out of time. Clicking a picture tests the click against that scene's differences;
// clicking the hint button spends a hint.
//
// ?seed=N fixes the decoration. ?shot=start|play|level2|end|over (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets window.__shotReady
// for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { CLICK_DONE, CLICK_FOUND, CLICK_NEAR, CLICK_WRONG, createWorld } from './world.js';
import { ACTION_CONFIRM, ACTION_HINT, ACTION_MUTE, ACTION_NEXT, ACTION_PAUSE, createInput } from './input.js';
import {
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
  createRenderer,
  inHintButton,
  inNextButton,
  inRetryButton,
  panelAt,
} from './render.js';
import { createSound } from './sound.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, { x: -1, y: -1 }, 1.2, '', 0);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let message = 'Click a difference on either picture to begin the hunt.';
  let winBonus = 0;

  function announce(text) {
    status.textContent = text;
  }

  function startScene(index) {
    world.resetScene(index);
    accumulator = 0;
    screen = SCREEN_PLAY;
    winBonus = 0;
    message = 'Click a difference on either picture to begin the hunt.';
    announce(`Playing ${world.scene().name}. Find 7 differences.`);
  }

  function endScene(win) {
    if (win) {
      winBonus = world.clearBonus();
      screen = SCREEN_WIN;
      sound.win();
      if (world.state.score > best) {
        best = world.state.score;
        saveBest(best);
      }
      announce(`Scene complete. Score ${world.state.score}.`);
    } else {
      screen = SCREEN_OVER;
      sound.lose();
      if (world.state.score > best) {
        best = world.state.score;
        saveBest(best);
      }
      announce(`Time's up. You found ${world.foundCount()} of ${world.totalDiffs()}.`);
    }
  }

  function handleClicks() {
    for (const click of input.takeClicks()) {
      sound.unlock();
      if (screen === SCREEN_TITLE) {
        startScene(0);
        continue;
      }
      if (screen === SCREEN_WIN) {
        if (inNextButton(click.x, click.y)) startScene(world.state.sceneIndex + 1);
        continue;
      }
      if (screen === SCREEN_OVER) {
        startScene(world.state.sceneIndex);
        continue;
      }
      if (screen !== SCREEN_PLAY) continue;
      if (inHintButton(click.x, click.y)) {
        useHint();
        continue;
      }
      const at = panelAt(click.x, click.y);
      if (at.side === -1) continue;
      const result = world.click(at.x, at.y);
      if (result.flags & CLICK_FOUND) {
        sound.found();
        const left = world.totalDiffs() - world.foundCount();
        message = left === 0 ? 'That was the last one!' : `Found it! ${left} to go.`;
        announce(`Found ${world.foundCount()} of ${world.totalDiffs()}.`);
        if (result.flags & CLICK_DONE) endScene(true);
      } else if (result.flags & CLICK_WRONG) {
        sound.wrong();
        message = 'Not a difference — 3 seconds off the clock.';
        announce('Wrong spot. Three seconds lost.');
      } else if (result.flags & CLICK_NEAR) {
        message = 'So close — just outside a difference.';
      }
    }
  }

  function useHint() {
    const index = world.hint();
    if (index === -1) {
      message = 'No hints left in this scene.';
      return;
    }
    sound.hint();
    message = 'A hint is ringing one difference still unfound.';
    announce('Hint used.');
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = sound.toggleMute();
      message = muted ? 'Sound off.' : 'Sound on.';
      return;
    }
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE) startScene(0);
      else if (screen === SCREEN_WIN) startScene(world.state.sceneIndex + 1);
      else if (screen === SCREEN_OVER) startScene(world.state.sceneIndex);
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
      return;
    }
    if (actions & ACTION_NEXT && screen === SCREEN_WIN) {
      startScene(world.state.sceneIndex + 1);
      return;
    }
    if (actions & ACTION_HINT && screen === SCREEN_PLAY) useHint();
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    handleClicks();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        if (world.tick(STEP)) {
          endScene(false);
          break;
        }
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, input.hover(), now / 1000, message, winBonus);
  }

  // Leaving the tab pauses a running game rather than letting the clock run unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Lantern Row. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
