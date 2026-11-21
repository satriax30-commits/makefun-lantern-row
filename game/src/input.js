// Mouse, touch and keyboard input. Clicks are queued with their logical (1280x720) position;
// the game drains the queue once a frame. Keyboard actions are a bitmask read the same way.

import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1 << 0;
export const ACTION_HINT = 1 << 1;
export const ACTION_NEXT = 1 << 2;
export const ACTION_PAUSE = 1 << 3;
export const ACTION_MUTE = 1 << 4;

export function createInput(canvas) {
  const clicks = [];
  let actions = 0;
  let hover = { x: -1, y: -1 };

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * FIELD.width,
      y: ((event.clientY - rect.top) / rect.height) * FIELD.height,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    clicks.push(toLogical(event));
  });
  canvas.addEventListener('pointermove', (event) => {
    hover = toLogical(event);
  });
  canvas.addEventListener('pointerleave', () => {
    hover = { x: -1, y: -1 };
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (event.code === 'Space' || event.code === 'Enter') actions |= ACTION_CONFIRM;
    else if (event.code === 'KeyH') actions |= ACTION_HINT;
    else if (event.code === 'KeyN') actions |= ACTION_NEXT;
    else if (event.code === 'KeyP' || event.code === 'Escape') actions |= ACTION_PAUSE;
    else if (event.code === 'KeyM') actions |= ACTION_MUTE;
  });

  return {
    /** All clicks since the last call, in the order they arrived. */
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    /** The keyboard actions pressed since the last call, as a bitmask. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The pointer's current logical position, or (-1, -1) when it is off the canvas. */
    hover() {
      return hover;
    },
  };
}
