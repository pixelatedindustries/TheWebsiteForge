/**
 * Cinematic ambient audio for the intro — a low, detuned drone (synthesised with
 * the Web Audio API, no asset files) plus a soft bell chime on enable. Muted by
 * default; `toggle()` must be called from a user gesture (browser autoplay rules).
 * A slow breathing LFO is written to the shared `bhPulse` state so the black
 * hole's halo pulses with the sound. The audio graph is a module singleton so it
 * survives across the composable's call sites.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let started = false;
let pulseRaf = 0;

function ensureGraph() {
  if (started) return;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // warm low-pass so the drone stays soft and round
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 440;
  filter.Q.value = 0.6;
  filter.connect(master);

  // detuned drone — A1 / E2 / A2
  [55, 82.5, 110].forEach((f, i) => {
    const osc = ctx!.createOscillator();
    osc.type = i === 2 ? "triangle" : "sine";
    osc.frequency.value = f;
    osc.detune.value = (i - 1) * 6;
    const g = ctx!.createGain();
    g.gain.value = i === 2 ? 0.12 : 0.2;
    osc.connect(g);
    g.connect(filter);
    osc.start();
  });
  started = true;
}

function chime() {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  [523.25, 783.99, 1046.5].forEach((f, i) => {
    const osc = ctx!.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    const g = ctx!.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12 / (i + 1), t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    osc.connect(g);
    g.connect(master!);
    osc.start(t);
    osc.stop(t + 1.7);
  });
}

export function useAmbientHum() {
  const enabled = useState("ambientHum", () => false);
  const pulse = useState<number>("bhPulse", () => 0);

  const startPulse = () => {
    const tick = () => {
      if (!ctx) return;
      // slow breathing that the halo glow follows
      pulse.value = 0.5 + 0.5 * Math.sin(ctx.currentTime * 1.1);
      pulseRaf = requestAnimationFrame(tick);
    };
    if (!pulseRaf) tick();
  };
  const stopPulse = () => {
    if (pulseRaf) cancelAnimationFrame(pulseRaf);
    pulseRaf = 0;
    pulse.value = 0;
  };

  const enable = async () => {
    ensureGraph();
    if (!ctx || !master) return;
    try {
      // resume() can reject if not driven by a trusted user gesture (autoplay
      // policy). Don't let that surface as an unhandled rejection.
      if (ctx.state === "suspended") await ctx.resume();
    } catch (err) {
      console.warn("[ambientHum] could not start audio:", err);
      enabled.value = false;
      return;
    }
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1.4);
    chime();
    startPulse();
    enabled.value = true;
  };

  const disable = () => {
    if (ctx && master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    }
    stopPulse();
    enabled.value = false;
  };

  const toggle = () => (enabled.value ? disable() : enable());

  // Stop the breathing RAF loop if the host component unmounts while the hum is
  // still active, so the loop doesn't keep mutating shared state forever.
  if (getCurrentInstance()) onUnmounted(stopPulse);

  return { enabled, toggle, disable };
}
