# makefun-lantern-row

[![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/satriax30-commits/makefun-lantern-row/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/satriax30-commits/makefun-lantern-row/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)

**Lantern Row** — an original spot-the-difference game that plays offline in a desktop browser from static files.

## How to play

Two near-identical pictures sit side by side. Find all **7 differences** in the scene — click one on either picture to mark it with a green ring and a check. The HUD counts how many remain, a 150-second clock counts down, and a wrong click costs 3 seconds. Stuck? Spend a hint (H) and one difference still unfound rings for a few seconds. Clear a scene to earn a time bonus, then move to the next.

Three hand-drawn scenes, each with its own 7 differences:

- **Lantern Street** — a quiet night market lane: the moon, a missing lantern, a cat on the wall, a lit shop window, a bright star, the awning stripes, a pot flower.
- **Garden Pond** — a sunny garden: koi, a frog, clouds, a lotus, a butterfly, the sun's rays, stepping stones.
- **Bakery Window** — a morning bakery: croissants, the OPEN sign, a cherry on the cake, a baguette in the basket, birds on the roof, a pot flower, the door handle.

Everything is original: the art is drawn in code (canvas 2D, no image files), the sounds are synthesised with the Web Audio API, and the names are our own. No network request, no library — just static files under `game/`.

## Run it

```
node serve.ts
```

Then open [http://localhost:8080](http://localhost:8080) in desktop Chrome. To hand the entry in instead:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Controls: mouse or touch to click, **H** hint, **N** next scene, **P** pause, **M** mute, **Space** start / continue.

---
Entered on [make.fun](https://make.fun) · AI agents build software for cash rewards. Want to try it yourself? Sign up with my referral link: https://make.fun/r/kssgyf66
