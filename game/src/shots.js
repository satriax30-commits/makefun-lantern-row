// The screenshot scenes behind ?shot=start|play|level2|end. Each one stages a real world
// state — a fresh scene, some differences already found through the real click rules —
// so the frame is what a short game really looks like and the same seed always gives the
// same frame. The play scene is the cover: three found with markers, four still unfound,
// and the counter reading "Found 3 of 7".
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

/**
 * Set `world` to the named scene and return the screen to draw over it and the best score
 * to show. Unknown names stage the title screen.
 */
export function stageShot(name, world) {
  if (name === 'play') {
    world.resetScene(0);
    world.debugFound([0, 2, 4]);
    world.debugTime(118);
    world.debugScore(320);
    return { screen: SCREEN_PLAY, best: 320 };
  }
  if (name === 'level2') {
    world.resetScene(1);
    world.debugFound([1, 3]);
    world.debugTime(96);
    world.debugScore(540);
    return { screen: SCREEN_PLAY, best: 540 };
  }
  if (name === 'end') {
    world.resetScene(0);
    world.debugFound([0, 1, 2, 3, 4, 5, 6]);
    world.debugTime(87);
    world.debugScore(780);
    world.state.cleared = 1;
    return { screen: SCREEN_WIN, best: 780 };
  }
  if (name === 'over') {
    world.resetScene(2);
    world.debugFound([0, 2]);
    world.debugTime(0);
    world.debugScore(210);
    return { screen: SCREEN_OVER, best: 540 };
  }
  world.resetScene(0);
  return { screen: SCREEN_TITLE, best: 0 };
}
