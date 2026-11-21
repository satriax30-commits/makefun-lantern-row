// The game's rules and state, with no drawing and no browser in it: which scene is up,
// which differences are found, the clock, the score, hints and mistakes. click() takes a
// panel-local point and returns what happened as bit flags, so the caller can react without
// the world knowing about screens or sound. Nothing here allocates after createWorld returns.
import {
  HINTS_PER_SCENE,
  HINT_SECONDS,
  NEAR_MISS_PAD,
  POINTS_FIND,
  POINTS_HINT,
  SCENE_TIME,
  WRONG_FLASH_SECONDS,
  WRONG_TIME_PENALTY,
} from './config.js';
import { SCENES } from './scene.js';

export const CLICK_FOUND = 1;
export const CLICK_WRONG = 2;
export const CLICK_NEAR = 4;
export const CLICK_DONE = 8;

export function createWorld() {
  const state = {
    sceneIndex: 0,
    found: [],
    foundAt: [],
    timeLeft: SCENE_TIME,
    elapsed: 0,
    score: 0,
    sceneScore: 0,
    mistakes: 0,
    hintsLeft: HINTS_PER_SCENE,
    hintIndex: -1,
    hintUntil: 0,
    wrong: null, // { x, y, until } in panel space, drawn as a red cross
    cleared: 0, // scenes cleared in this run
  };

  function diffs() {
    return SCENES[state.sceneIndex % SCENES.length].diffs;
  }

  function resetScene(index) {
    state.sceneIndex = index % SCENES.length;
    const count = diffs().length;
    state.found = new Array(count).fill(false);
    state.foundAt = new Array(count).fill(0);
    state.timeLeft = SCENE_TIME;
    state.elapsed = 0;
    state.sceneScore = 0;
    state.mistakes = 0;
    state.hintsLeft = HINTS_PER_SCENE;
    state.hintIndex = -1;
    state.hintUntil = 0;
    state.wrong = null;
  }

  function foundCount() {
    let count = 0;
    for (const f of state.found) if (f) count += 1;
    return count;
  }

  /** A click at panel-local (x, y). Either panel counts: the pictures are the same hunt. */
  function click(x, y) {
    const list = diffs();
    let near = false;
    for (let i = 0; i < list.length; i += 1) {
      if (state.found[i]) continue;
      const d = list[i];
      const dist = Math.hypot(x - d.x, y - d.y);
      if (dist <= d.r) {
        state.found[i] = true;
        state.foundAt[i] = state.elapsed;
        state.sceneScore += POINTS_FIND;
        state.score += POINTS_FIND;
        let flags = CLICK_FOUND;
        if (foundCount() === list.length) flags |= CLICK_DONE;
        return { flags, index: i };
      }
      if (dist <= d.r + NEAR_MISS_PAD) near = true;
    }
    if (near) return { flags: CLICK_NEAR, index: -1 };
    state.mistakes += 1;
    state.timeLeft = Math.max(0, state.timeLeft - WRONG_TIME_PENALTY);
    state.wrong = { x, y, until: state.elapsed + WRONG_FLASH_SECONDS };
    return { flags: CLICK_WRONG, index: -1 };
  }

  /** Spend a hint: ring one difference that is still unfound for a few seconds. */
  function hint() {
    if (state.hintsLeft <= 0) return -1;
    const list = diffs();
    const open = [];
    for (let i = 0; i < list.length; i += 1) if (!state.found[i]) open.push(i);
    if (open.length === 0) return -1;
    const index = open[Math.floor(open.length / 2)];
    state.hintsLeft -= 1;
    state.score = Math.max(0, state.score - POINTS_HINT);
    state.sceneScore = Math.max(0, state.sceneScore - POINTS_HINT);
    state.hintIndex = index;
    state.hintUntil = state.elapsed + HINT_SECONDS;
    return index;
  }

  /** Advance the clock by dt seconds; true when the time just ran out. */
  function tick(dt) {
    state.elapsed += dt;
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      return true;
    }
    return false;
  }

  /** The time bonus for clearing a scene: 5 points per second left on the clock. */
  function clearBonus() {
    const bonus = Math.round(state.timeLeft) * 5;
    state.score += bonus;
    state.sceneScore += bonus;
    state.cleared += 1;
    return bonus;
  }

  return {
    state,
    resetScene,
    foundCount,
    click,
    hint,
    tick,
    clearBonus,
    totalDiffs() {
      return diffs().length;
    },
    scene() {
      return SCENES[state.sceneIndex % SCENES.length];
    },
    // Helpers for the deterministic screenshot scenes: stage a state without playing.
    debugFound(indices, at = -1) {
      for (const i of indices) {
        state.found[i] = true;
        state.foundAt[i] = at;
      }
    },
    debugTime(seconds) {
      state.timeLeft = seconds;
    },
    debugScore(value) {
      state.score = value;
      state.sceneScore = value;
    },
  };
}
