// Every tuning number and colour in one place. The playfield is a fixed 1280x720 logical
// area; the renderer scales it to the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** The two picture panels: 600x500 each, side by side under the HUD bar. */
export const PANEL = { width: 600, height: 500, leftX: 20, rightX: 660, y: 88 };

/** Seconds on the clock for one scene, and how many hints a scene allows. */
export const SCENE_TIME = 150;
export const HINTS_PER_SCENE = 3;

/** Scoring: a find is worth this; a hint costs this many points. */
export const POINTS_FIND = 100;
export const POINTS_HINT = 15;

/** Seconds a wrong click costs, and how long a wrong-click cross stays on screen. */
export const WRONG_TIME_PENALTY = 3;
export const WRONG_FLASH_SECONDS = 0.7;

/** How long a hint ring pulses around its difference, in seconds. */
export const HINT_SECONDS = 2.5;

/** Seconds a found marker takes to pop in, and how far a wrong click may be from a
 * difference's centre and still count as a near miss (a gentler shake, no penalty). */
export const MARK_POP_SECONDS = 0.25;
export const NEAR_MISS_PAD = 14;

export const PALETTE = {
  backdrop: '#10131f',
  hud: '#1b2138',
  hudLine: '#2c3552',
  panelFrame: '#f2c94c',
  panelFrameFound: '#7ee787',
  text: '#f4f1e6',
  muted: '#9aa3b8',
  accent: '#f2c94c',
  accentDark: '#c98f2e',
  good: '#7ee787',
  bad: '#ff6b6b',
  button: '#2c3552',
  buttonHover: '#3a4470',
  overlay: 'rgba(10, 12, 24, 0.78)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'lantern-row.best';
