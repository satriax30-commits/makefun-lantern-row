// A small seeded generator (mulberry32) so a scene's decoration — stars, stones, petals —
// is identical on both panels and identical every visit with the same seed. Nothing here
// reads the clock or Math.random, so a screenshot staged with a seed is reproducible.

/** Make a generator from an unsigned 32-bit seed. */
export function createRandom(seed) {
  let state = seed >>> 0;
  return {
    /** The next float in [0, 1). */
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** A float in [min, max). */
    range(min, max) {
      return min + this.next() * (max - min);
    },
    /** An integer in [min, max]. */
    int(min, max) {
      return Math.floor(this.range(min, max + 1));
    },
    /** One element of `items`, chosen uniformly. */
    pick(items) {
      return items[Math.floor(this.next() * items.length)];
    },
  };
}
