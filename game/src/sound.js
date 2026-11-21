// All sound is synthesised with the Web Audio API: short oscillator blips, no audio files,
// nothing loaded over the network. The context is created lazily on the first user gesture,
// so a page that never gets a click stays silent.

/** A tiny synth: one oscillator plus a gain envelope per note. */
export function createSound() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context === null) {
      try {
        const Ctor = window.AudioContext ?? window.webkitAudioContext;
        if (!Ctor) return null;
        context = new Ctor();
      } catch {
        return null;
      }
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  /** Play one note: frequency in Hz, length in seconds, wave shape and peak gain. */
  function note(freq, seconds, type, gain, when = 0) {
    const ctx = ensure();
    if (ctx === null || muted) return;
    const start = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(amp).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  }

  return {
    /** Wake the context (call from a click handler); harmless when sound is off. */
    unlock() {
      ensure();
    },
    /** A soft click for buttons and panel taps that land on nothing. */
    click() {
      note(660, 0.06, 'sine', 0.08);
    },
    /** Two rising notes when a difference is found. */
    found() {
      note(523.25, 0.12, 'sine', 0.16);
      note(783.99, 0.18, 'sine', 0.16, 0.09);
    },
    /** A low dull buzz for a wrong click. */
    wrong() {
      note(160, 0.16, 'sawtooth', 0.07);
      note(120, 0.2, 'sawtooth', 0.06, 0.05);
    },
    /** A single bright ping when a hint is spent. */
    hint() {
      note(880, 0.1, 'triangle', 0.12);
    },
    /** A four-note rising arpeggio for clearing a scene. */
    win() {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
        note(freq, 0.22, 'triangle', 0.14, index * 0.11);
      });
    },
    /** A short descending phrase for running out of time. */
    lose() {
      [392, 329.63, 261.63].forEach((freq, index) => {
        note(freq, 0.25, 'triangle', 0.11, index * 0.14);
      });
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
  };
}
