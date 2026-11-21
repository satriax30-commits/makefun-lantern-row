// The pictures themselves: three original scenes, each drawn with plain canvas 2D shapes —
// no image files, no copied art. Every scene is drawn twice, once per panel: variant 0 is
// the original, variant 1 the changed one. The differences are small branches inside the
// draw functions, and SCENES lists where each one sits so the world can test clicks.
//
// Panel space is 600x500. Seeded decoration (stars, stones, petals) is drawn first from a
// fresh generator, so it is identical on both panels; nothing after it reads the generator,
// so a difference can never shift the decoration.

import { createRandom } from './random.js';

export const PANEL_W = 600;
export const PANEL_H = 500;

function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function roundRect(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function poly(ctx, points, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, width, stroke) {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function gradient(ctx, x1, y1, x2, y2, stops) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

/** A five-point star, for the night sky and the lotus petals' sparkle. */
function star(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

/** A simple five-petal flower. */
function flower(ctx, x, y, r, petal, centre) {
  for (let i = 0; i < 5; i += 1) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    circle(ctx, x + Math.cos(angle) * r * 0.62, y + Math.sin(angle) * r * 0.62, r * 0.55, petal);
  }
  circle(ctx, x, y, r * 0.42, centre);
}

/** A paper lantern: glowing oval body with ribs and a tassel. */
function lantern(ctx, x, y, body, glow) {
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 18;
  ellipse(ctx, x, y, 26, 32, body);
  ctx.restore();
  ctx.strokeStyle = 'rgba(120, 30, 20, 0.55)';
  ctx.lineWidth = 2;
  for (const dy of [-18, -6, 6, 18]) {
    ctx.beginPath();
    ctx.ellipse(x, y + dy, 24 - Math.abs(dy) * 0.35, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  rect(ctx, x - 8, y - 38, 16, 7, '#8a5a2b');
  line(ctx, x, y + 32, x, y + 44, 3, '#f2c94c');
  circle(ctx, x, y + 48, 4, '#f2c94c');
}

/** A small sitting cat, drawn from circles and triangles. */
function cat(ctx, x, y, coat) {
  ellipse(ctx, x, y, 26, 20, coat);
  circle(ctx, x - 2, y - 26, 16, coat);
  poly(ctx, [[x - 16, y - 34], [x - 20, y - 50], [x - 6, y - 40]], coat);
  poly(ctx, [[x + 10, y - 38], [x + 16, y - 52], [x + 20, y - 34]], coat);
  circle(ctx, x - 8, y - 28, 2, '#10131f');
  circle(ctx, x + 4, y - 28, 2, '#10131f');
  ctx.strokeStyle = coat;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 12);
  ctx.quadraticCurveTo(x + 44, y + 2, x + 40, y - 22);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Scene 1 — Lantern Street: a quiet night market lane under paper lanterns.
// ---------------------------------------------------------------------------

const LANTERN_DIFFS = [
  { x: 505, y: 70, r: 34 }, // the moon: full, or a crescent
  { x: 420, y: 150, r: 30 }, // the fourth lantern: there, or gone
  { x: 500, y: 385, r: 36 }, // the cat on the wall: sitting, or gone
  { x: 120, y: 305, r: 40 }, // the shop window: lit warm, or dark
  { x: 420, y: 80, r: 14 }, // one bright star by the moon: there, or gone
  { x: 145, y: 218, r: 44 }, // the awning stripes: red, or teal
  { x: 60, y: 445, r: 22 }, // the pot flower: red, or yellow
];

function drawLanternStreet(ctx, v) {
  const rng = createRandom(101);
  ctx.fillStyle = gradient(ctx, 0, 0, 0, 500, [[0, '#141b33'], [0.6, '#27335c'], [1, '#3a2f52']]);
  ctx.fillRect(0, 0, 600, 500);

  // Stars, one of them the bright difference star.
  for (let i = 0; i < 46; i += 1) {
    const x = rng.range(8, 592);
    const y = rng.range(8, 300);
    circle(ctx, x, y, rng.range(0.8, 1.9), 'rgba(244, 241, 230, 0.85)');
  }
  if (v === 0) star(ctx, 420, 80, 9, '#fff7c0');

  // The moon, full or bitten into a crescent.
  circle(ctx, 505, 70, 30, '#f7efc8');
  circle(ctx, 505, 70, 26, '#efe3ae');
  if (v === 1) circle(ctx, 520, 60, 26, '#27335c');

  // Distant rooftops with two lit windows.
  ctx.fillStyle = '#12172a';
  poly(ctx, [[0, 500], [0, 330], [90, 300], [180, 330], [180, 500]], '#12172a');
  poly(ctx, [[330, 500], [330, 320], [430, 292], [530, 320], [530, 500]], '#12172a');
  rect(ctx, 60, 340, 22, 26, '#f2c94c');
  rect(ctx, 400, 330, 22, 26, '#e8a34c');

  // The street.
  ctx.fillStyle = '#3a3f52';
  ctx.fillRect(0, 380, 600, 120);
  ctx.fillStyle = '#454a61';
  for (let i = 0; i < 60; i += 1) {
    const x = rng.range(0, 590);
    const y = rng.range(388, 492);
    ellipse(ctx, x, y, rng.range(9, 16), rng.range(4, 6), '#454a61');
  }

  // The shop front: cream wall, striped awning, window, door.
  rect(ctx, 30, 200, 230, 200, '#e8dcc0');
  rect(ctx, 30, 200, 230, 10, '#c9b48f');
  const stripe = v === 0 ? '#d95f4b' : '#2e8f86';
  for (let i = 0; i < 6; i += 1) {
    rect(ctx, 30 + i * 39, 210, 20, 26, i % 2 === 0 ? stripe : '#f4f1e6');
  }
  rect(ctx, 30, 236, 230, 6, '#8a5a2b');
  // Window: warm light, or dark glass.
  rect(ctx, 56, 258, 128, 96, '#5a4632');
  rect(ctx, 62, 264, 116, 84, v === 0 ? '#ffcf6e' : '#2c3552');
  line(ctx, 120, 264, 120, 348, 4, '#5a4632');
  line(ctx, 62, 306, 178, 306, 4, '#5a4632');
  if (v === 0) {
    circle(ctx, 90, 330, 8, '#d95f4b');
    circle(ctx, 150, 290, 8, '#2e8f86');
  }
  // Door.
  rect(ctx, 196, 258, 52, 142, '#7a4a2b');
  circle(ctx, 240, 330, 4, '#f2c94c');

  // The lantern string across the lane.
  line(ctx, 0, 118, 600, 102, 3, '#10131f');
  const lanternXs = [90, 200, 310, 420, 520];
  for (let i = 0; i < lanternXs.length; i += 1) {
    if (v === 1 && i === 3) continue; // the fourth lantern is gone
    line(ctx, lanternXs[i], 110, lanternXs[i], 118, 2, '#10131f');
    lantern(ctx, lanternXs[i], 152, i % 2 === 0 ? '#e5534b' : '#f28c38', '#ff9a3c');
  }

  // A hanging sign by the shop.
  line(ctx, 282, 150, 282, 168, 3, '#10131f');
  roundRect(ctx, 262, 168, 40, 52, 6, '#f4f1e6');
  ctx.fillStyle = '#d95f4b';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('茶', 282, 196);

  // The low wall and the cat that may or may not be sitting on it.
  rect(ctx, 420, 400, 180, 100, '#4a4f63');
  rect(ctx, 420, 400, 180, 10, '#5c6178');
  if (v === 0) cat(ctx, 500, 388, '#e8963c');

  // The flower pot by the door.
  poly(ctx, [[44, 452], [76, 452], [72, 482], [48, 482]], '#b0613c');
  line(ctx, 60, 452, 60, 428, 4, '#3f7a3a');
  flower(ctx, 60, 420, 12, v === 0 ? '#e5534b' : '#f2c94c', '#f2c94c');
}

// ---------------------------------------------------------------------------
// Scene 2 — Garden Pond: a sunny garden with koi, a frog and a blossom tree.
// ---------------------------------------------------------------------------

const POND_DIFFS = [
  { x: 360, y: 420, r: 30 }, // the middle koi: swimming, or gone
  { x: 500, y: 360, r: 28 }, // the frog on the rock: there, or gone
  { x: 450, y: 90, r: 36 }, // the second cloud: there, or gone
  { x: 230, y: 395, r: 24 }, // the lotus flower: pink, or white
  { x: 150, y: 150, r: 22 }, // the butterfly: fluttering, or gone
  { x: 90, y: 80, r: 42 }, // the sun's rays: shining, or gone
  { x: 430, y: 465, r: 26 }, // the third stepping stone: there, or gone
];

function cloud(ctx, x, y, s) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  circle(ctx, x, y, 22 * s, 'rgba(255, 255, 255, 0.92)');
  circle(ctx, x + 22 * s, y + 4 * s, 17 * s, 'rgba(255, 255, 255, 0.92)');
  circle(ctx, x - 22 * s, y + 6 * s, 15 * s, 'rgba(255, 255, 255, 0.92)');
  ellipse(ctx, x, y + 10 * s, 40 * s, 12 * s, 'rgba(255, 255, 255, 0.92)');
}

/** A koi: orange body, white patches, a forked tail. */
function koi(ctx, x, y, angle, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  poly(ctx, [[-26, 0], [-36, -9], [-36, 9]], '#f28c38');
  ellipse(ctx, 0, 0, 26, 11, '#f28c38');
  ellipse(ctx, -6, -4, 9, 5, '#f4f1e6');
  ellipse(ctx, 10, 3, 7, 4, '#f4f1e6');
  circle(ctx, 20, -3, 2, '#10131f');
  ctx.restore();
}

function frog(ctx, x, y) {
  ellipse(ctx, x, y, 22, 15, '#5da24a');
  circle(ctx, x - 12, y - 14, 9, '#5da24a');
  circle(ctx, x + 12, y - 14, 9, '#5da24a');
  circle(ctx, x - 12, y - 16, 4, '#f4f1e6');
  circle(ctx, x + 12, y - 16, 4, '#f4f1e6');
  circle(ctx, x - 12, y - 16, 2, '#10131f');
  circle(ctx, x + 12, y - 16, 2, '#10131f');
  ctx.strokeStyle = '#3f7a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y + 2, 10, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

function drawGardenPond(ctx, v) {
  const rng = createRandom(202);
  ctx.fillStyle = gradient(ctx, 0, 0, 0, 500, [[0, '#aee3f5'], [0.55, '#d8f0e0'], [1, '#e8f5d8']]);
  ctx.fillRect(0, 0, 600, 500);

  // The sun is drawn after the blossom canopy so it shines through the tree, not behind it.
  cloud(ctx, 300, 60, 1);
  if (v === 0) cloud(ctx, 450, 90, 0.8);

  // The blossom tree on the left.
  rect(ctx, 62, 200, 26, 220, '#7a4a2b');
  rect(ctx, 62, 250, 60, 12, '#7a4a2b');
  const blossom = ['#f7a8c4', '#f78fb8', '#fbc2d4'];
  for (let i = 0; i < 26; i += 1) {
    const bx = rng.range(20, 190);
    const by = rng.range(60, 230);
    circle(ctx, bx, by, rng.range(12, 26), blossom[i % 3]);
  }
  // The butterfly by the tree, or not.
  if (v === 0) {
    ellipse(ctx, 142, 146, 10, 14, '#8a6fd6');
    ellipse(ctx, 158, 146, 10, 14, '#a58ae0');
    line(ctx, 150, 138, 150, 164, 2, '#10131f');
  }

  // The sun, with rays or without.
  if (v === 0) {
    ctx.strokeStyle = '#f2c94c';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i += 1) {
      const a = (i * Math.PI) / 4;
      line(ctx, 90 + Math.cos(a) * 42, 80 + Math.sin(a) * 42, 90 + Math.cos(a) * 56, 80 + Math.sin(a) * 56, 5, '#f2c94c');
    }
  }
  circle(ctx, 90, 80, 34, '#ffd94d');
  circle(ctx, 90, 80, 28, '#ffe98a');

  // Grass at the bottom.
  ctx.fillStyle = '#7fbf5a';
  ctx.fillRect(0, 420, 600, 80);
  ctx.fillStyle = '#8fce68';
  for (let i = 0; i < 40; i += 1) {
    const gx = rng.range(0, 595);
    line(ctx, gx, 500, gx + 3, 484, 2, '#6aa84f');
  }

  // The pond.
  ellipse(ctx, 330, 400, 235, 88, '#4fa8d8');
  ellipse(ctx, 330, 400, 220, 76, '#63b8e0');
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 3;
  for (const [rx, ry] of [[150, 12], [200, 26], [120, 40]]) {
    ctx.beginPath();
    ctx.ellipse(330, 400, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Lily pads, one with the lotus.
  ellipse(ctx, 330, 440, 46, 14, '#3f8f4f');
  ellipse(ctx, 420, 390, 40, 12, '#4a9e58');
  ellipse(ctx, 230, 400, 44, 13, '#3f8f4f');
  flower(ctx, 230, 388, 13, v === 0 ? '#f78fb8' : '#f4f1e6', '#f2c94c');

  // The koi, three or two.
  koi(ctx, 280, 388, 0.15, 1);
  koi(ctx, 430, 380, -0.2, 0.9);
  if (v === 0) koi(ctx, 360, 422, 0.05, 1);

  // The rock and the frog that may be on it.
  ellipse(ctx, 500, 385, 42, 20, '#8b93a3');
  ellipse(ctx, 500, 378, 30, 12, '#9aa3b8');
  if (v === 0) frog(ctx, 500, 358);

  // Stepping stones across the front, four or three.
  const stones = [150, 250, 430, 520];
  for (let i = 0; i < stones.length; i += 1) {
    if (v === 1 && i === 2) continue;
    ellipse(ctx, stones[i], 468, 34, 12, '#c9c2b0');
    ellipse(ctx, stones[i], 464, 26, 8, '#ddd6c2');
  }

  // Small flowers along the front edge.
  for (const [fx, col] of [[40, '#e5534b'], [110, '#f2c94c'], [580, '#e5534b'], [340, '#f2c94c']]) {
    line(ctx, fx, 486, fx, 468, 3, '#3f7a3a');
    flower(ctx, fx, 462, 9, col, '#f2c94c');
  }
}

// ---------------------------------------------------------------------------
// Scene 3 — Bakery Window: a morning bakery with bread, a sign and a bicycle.
// ---------------------------------------------------------------------------

const BAKERY_DIFFS = [
  { x: 220, y: 275, r: 26 }, // the third croissant: baked, or gone
  { x: 487, y: 290, r: 30 }, // the door sign: OPEN, or CLOSED
  { x: 330, y: 315, r: 18 }, // the cherry on the cake: there, or gone
  { x: 560, y: 415, r: 28 }, // the baguette in the basket: there, or gone
  { x: 310, y: 90, r: 20 }, // the second bird on the roof: there, or gone
  { x: 70, y: 455, r: 22 }, // the pot flower: red, or purple
  { x: 485, y: 340, r: 30 }, // the door handle: left side, or right side
];

function croissant(ctx, x, y, s) {
  ctx.fillStyle = '#e8a34c';
  ctx.beginPath();
  ctx.moveTo(x - 20 * s, y + 8 * s);
  ctx.quadraticCurveTo(x, y - 18 * s, x + 20 * s, y + 8 * s);
  ctx.quadraticCurveTo(x, y + 2 * s, x - 20 * s, y + 8 * s);
  ctx.fill();
  ctx.strokeStyle = '#c98f2e';
  ctx.lineWidth = 2;
  for (const dx of [-10, 0, 10]) {
    ctx.beginPath();
    ctx.moveTo(x + dx * s, y - 8 * s);
    ctx.lineTo(x + dx * s, y + 6 * s);
    ctx.stroke();
  }
}

function drawBakery(ctx, v) {
  const rng = createRandom(303);
  ctx.fillStyle = gradient(ctx, 0, 0, 0, 500, [[0, '#ffe9c4'], [0.6, '#ffd9a8'], [1, '#f7c489']]);
  ctx.fillRect(0, 0, 600, 500);

  // The morning sun.
  circle(ctx, 520, 70, 30, '#ffd94d');
  circle(ctx, 520, 70, 24, '#ffe98a');

  // The building: terracotta roof, cream wall.
  poly(ctx, [[30, 150], [570, 150], [540, 104], [60, 104]], '#c96f3f');
  rect(ctx, 30, 104, 540, 12, '#a8552e');
  rect(ctx, 40, 150, 520, 290, '#f4e3c2');
  rect(ctx, 40, 150, 520, 8, '#e0c9a0');

  // Birds on the roof, two or one.
  function bird(x, y) {
    ctx.strokeStyle = '#3a3f52';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x - 6, y, 6, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 6, y, 6, Math.PI, 0);
    ctx.stroke();
  }
  bird(250, 92);
  if (v === 0) bird(310, 88);

  // The striped awning.
  for (let i = 0; i < 12; i += 1) {
    rect(ctx, 60 + i * 40, 162, 20, 30, i % 2 === 0 ? '#e8833a' : '#f4f1e6');
  }
  rect(ctx, 60, 192, 480, 6, '#c96f3f');

  // The display window: shelves of bread and a cake.
  rect(ctx, 80, 210, 320, 170, '#8a6a45');
  rect(ctx, 88, 218, 304, 154, '#bfe3f0');
  rect(ctx, 88, 288, 304, 8, '#8a6a45');
  rect(ctx, 88, 336, 304, 8, '#8a6a45');
  croissant(ctx, 130, 272, 1);
  croissant(ctx, 175, 272, 1);
  if (v === 0) croissant(ctx, 220, 272, 1);
  // Baguettes on the second shelf.
  for (const bx of [130, 210]) {
    roundRect(ctx, bx - 34, 318, 68, 14, 7, '#d99a4e');
    line(ctx, bx - 20, 322, bx - 8, 322, 2, '#b57a32');
    line(ctx, bx + 4, 322, bx + 16, 322, 2, '#b57a32');
  }
  // The cake with its cherry, or without.
  ellipse(ctx, 330, 330, 34, 12, '#f7a8c4');
  rect(ctx, 300, 312, 60, 14, '#f4f1e6');
  if (v === 0) circle(ctx, 330, 306, 7, '#d93a3a');

  // The door, its round window, its handle and its sign.
  rect(ctx, 440, 210, 90, 230, '#7a4a2b');
  rect(ctx, 448, 218, 74, 214, '#8a5a36');
  circle(ctx, 485, 262, 22, '#bfe3f0');
  ctx.strokeStyle = '#5a4632';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(485, 262, 22, 0, Math.PI * 2);
  ctx.stroke();
  const handleX = v === 0 ? 456 : 514;
  circle(ctx, handleX, 340, 6, '#f2c94c');
  // The sign says OPEN, or CLOSED.
  roundRect(ctx, 462, 288, 50, 30, 5, '#f4f1e6');
  ctx.fillStyle = v === 0 ? '#3f8f4f' : '#d93a3a';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(v === 0 ? 'OPEN' : 'SHUT', 487, 304);

  // The street and its cobbles.
  ctx.fillStyle = '#b8a88f';
  ctx.fillRect(0, 440, 600, 60);
  for (let i = 0; i < 36; i += 1) {
    const x = rng.range(0, 590);
    const y = rng.range(446, 494);
    ellipse(ctx, x, y, rng.range(9, 15), rng.range(4, 6), '#c9b99c');
  }

  // The potted plant by the door.
  poly(ctx, [[54, 452], [86, 452], [82, 482], [58, 482]], '#b0613c');
  line(ctx, 70, 452, 70, 428, 4, '#3f7a3a');
  flower(ctx, 70, 422, 12, v === 0 ? '#e5534b' : '#8a6fd6', '#f2c94c');

  // The bicycle leaning on the wall, basket with a baguette or empty.
  ctx.strokeStyle = '#3a3f52';
  ctx.lineWidth = 4;
  circle(ctx, 540, 452, 20, '#3a3f52');
  circle(ctx, 588, 452, 20, '#3a3f52');
  line(ctx, 540, 452, 566, 420, 4, '#3a3f52');
  line(ctx, 588, 452, 566, 420, 4, '#3a3f52');
  line(ctx, 566, 420, 540, 420, 4, '#3a3f52');
  line(ctx, 566, 420, 580, 408, 4, '#3a3f52');
  rect(ctx, 556, 402, 26, 16, '#8a5a2b');
  if (v === 0) {
    ctx.save();
    ctx.translate(569, 398);
    ctx.rotate(-0.5);
    roundRect(ctx, -6, -22, 12, 26, 6, '#d99a4e');
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// The catalogue: name, tagline and the differences of each scene.
// ---------------------------------------------------------------------------

export const SCENES = [
  {
    id: 'lantern-street',
    name: 'Lantern Street',
    tagline: 'A quiet night market lane — 7 differences hide among the lanterns.',
    seed: 101,
    diffs: LANTERN_DIFFS,
    draw: drawLanternStreet,
  },
  {
    id: 'garden-pond',
    name: 'Garden Pond',
    tagline: 'A sunny garden pond — 7 differences swim, hop and flutter.',
    seed: 202,
    diffs: POND_DIFFS,
    draw: drawGardenPond,
  },
  {
    id: 'bakery-window',
    name: 'Bakery Window',
    tagline: 'A morning bakery — 7 differences among the bread and birds.',
    seed: 303,
    diffs: BAKERY_DIFFS,
    draw: drawBakery,
  },
];

/** Draw one panel of one scene into a fresh 600x500 canvas: variant 0 is the original. */
export function renderPanel(sceneIndex, variant) {
  const scene = SCENES[sceneIndex % SCENES.length];
  const canvas = document.createElement('canvas');
  canvas.width = PANEL_W;
  canvas.height = PANEL_H;
  const ctx = canvas.getContext('2d');
  scene.draw(ctx, variant);
  return canvas;
}
