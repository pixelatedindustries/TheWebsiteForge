<script setup lang="ts">
const host = ref<HTMLDivElement | null>(null);
// drives the "vortex" swallow on Enter (set from the intro page)
const swallow = useState<{
  active: boolean;
  vortex: number;
  cover: number;
}>("blackHoleSwallow", () => ({
  active: false,
  vortex: 0,
  cover: 0,
}));
// ambient-audio amplitude (0..1) → the halo breathes with it (set by useAmbientHum)
const pulse = useState<number>("bhPulse", () => 0);

let cleanup: (() => void) | null = null;
let disposed = false;

onBeforeUnmount(() => {
  disposed = true;
  cleanup?.();
});

onMounted(async () => {
  const el = host.value;
  if (!el) return;
  const THREE = await import("three");
  if (disposed || !host.value) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tier = getDeviceTier();
  const OCTAVES = fbmOctaves(tier); // 2 on low-power devices, 4 otherwise
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
  renderer.setPixelRatio(cappedPixelRatio(1.5, tier));
  renderer.setClearColor(0x000000, 1);
  el.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, {
    width: "100%",
    height: "100%",
    display: "block",
    // start invisible and fade in over the CSS poster (see default.vue) so the
    // hand-off from the painted-on placeholder to the live shader is seamless.
    opacity: "0",
    transition: "opacity 0.7s ease",
  });

  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uAspect: { value: 1 },
    uVortex: { value: 0 },
    uBirth: { value: reduced ? 1 : 0 },
    uDolly: { value: 0 },
    uPulse: { value: 0 },
    uRippleAge: { value: -1 },
    uRippleAmp: { value: 1 },
    uStarStart: { value: new THREE.Vector2(0, 0) },
    uStarProg: { value: 0 },
    uswallowCover: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime; uniform vec2 uMouse; uniform float uAspect; uniform float uVortex;
      uniform float uBirth; uniform float uDolly; uniform float uPulse;
      uniform float uRippleAge; uniform float uRippleAmp;
      uniform vec2 uStarStart; uniform float uStarProg;
      varying vec2 vUv;

      float hash21(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
      float vnoise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        float a = hash21(i), b = hash21(i + vec2(1,0)), c = hash21(i + vec2(0,1)), d = hash21(i + vec2(1,1));
        vec2 u = f*f*(3.0 - 2.0*f);
        return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
      }
      float fbm(vec2 p){
        float s = 0.0, a = 0.5;
        for(int i=0;i<${OCTAVES};i++){ s += a*vnoise(p); p *= 2.02; a *= 0.5; }
        return s;
      }

      // flowing aurora (kept dim) + a THREE-layer starfield parallaxed by the cursor
      vec3 sky(vec2 p){
        vec2 q = vec2(
          fbm(p * 1.1 + uTime * 0.03),
          fbm(p * 1.1 + vec2(4.1, 1.3) - uTime * 0.025)
        );
        float n = fbm(p * 1.2 + 2.1 * q);
        vec3 deep    = vec3(0.07);
        vec3 emerald = vec3(0.32);
        vec3 cyan    = vec3(0.55);
        vec3 blue    = vec3(0.26);
        vec3 aur = mix(deep, emerald, smoothstep(0.12, 0.52, n));
        aur = mix(aur, cyan, smoothstep(0.48, 0.82, n));
        aur = mix(aur, blue, smoothstep(0.72, 1.0, n));
        vec3 col = aur * pow(n, 2.3) * 0.6;

        // far layer — fine, faint, barely parallaxes (distant)
        {
          vec2 g = (p + uMouse * 0.015) * 17.0; vec2 id = floor(g), f = fract(g) - 0.5;
          float s = hash21(id + 3.3);
          if (s > 0.93){
            vec2 pos = (vec2(hash21(id + 1.7), hash21(id + 4.1)) - 0.5) * 0.7;
            float b = smoothstep(0.045, 0.0, length(f - pos)) * ((s - 0.93) / 0.07);
            col += b * vec3(0.78) * 0.7;
          }
        }
        // mid layer — twinkling stars, moderate parallax
        {
          vec2 g = (p + uMouse * 0.05) * 9.5; vec2 id = floor(g), f = fract(g) - 0.5;
          float s = hash21(id);
          if (s > 0.93){
            vec2 pos = (vec2(hash21(id + 1.7), hash21(id + 4.1)) - 0.5) * 0.7;
            float b = smoothstep(0.06, 0.0, length(f - pos)) * ((s - 0.93) / 0.07);
            b *= 0.6 + 0.4 * sin(uTime * 3.0 + s * 40.0);
            col += b * vec3(0.92);
          }
        }
        // near layer — sparse big glowing stars, strongest parallax (close)
        {
          vec2 g = (p + uMouse * 0.11) * 5.0; vec2 id = floor(g), f = fract(g) - 0.5;
          float s = hash21(id + 9.3);
          if (s > 0.965){
            vec2 pos = (vec2(hash21(id + 2.1), hash21(id + 5.7)) - 0.5) * 0.6;
            float b = smoothstep(0.17, 0.0, length(f - pos)) * ((s - 0.965) / 0.035);
            b *= 0.7 + 0.3 * sin(uTime * 2.0 + s * 20.0);
            col += b * b * vec3(0.88) * 1.4;
          }
        }
        return col;
      }

      void main(){
        vec2 p = (vUv - 0.5);
        p.x *= uAspect;

        // the hole sits to the right and drifts slightly with the cursor
        vec2 hole = vec2(0.34, 0.0) + uMouse * 0.05;
        vec2 d = p - hole;
        float r = length(d);
        float rs = 0.135;   // event-horizon radius — CONSTANT (the hole never grows)
        float v = uVortex;

        // global zoom of the field around the hole: vortex sucks it in, scene-birth
        // rushes the field inward from far away, the scroll z-dolly pushes in
        float zoom = 1.0 + v * 4.5;
        zoom *= mix(7.0, 1.0, smoothstep(0.0, 1.0, uBirth));
        zoom *= 1.0 - uDolly * 0.42;

        // STRONG gravitational lensing + spiral; both deepen on the vortex
        float bend = (0.30 + v * 0.45) / (r + 0.035);
        float swirl = (0.50 + v * 7.0) / (r + 0.12) + uTime * 0.035;
        mat2 rot = mat2(cos(swirl), -sin(swirl), sin(swirl), cos(swirl));
        vec2 warped = rot * (d * zoom + normalize(d) * bend);

        // spacetime ripple — a retriggerable wave expanding outward from the hole
        if (uRippleAge >= 0.0) {
          float waveR = uRippleAge * 0.7;
          float env = exp(-uRippleAge * 1.6) * exp(-pow((r - waveR) * 5.0, 2.0));
          warped += normalize(d) * sin(r * 36.0 - uRippleAge * 7.0) * env * 0.05 * uRippleAmp;
        }

        vec3 col = sky(hole + warped);

        // Einstein-ring magnification — lensing concentrates background light just
        // outside the horizon (multiplicative → magnified starlight, not a painted ring)
        float ering = exp(-pow((r - rs * 1.32) / 0.028, 2.0));
        col *= 1.0 + ering * 0.7;

        // soft atmospheric halo hugging the horizon — breathes with the ambient audio
        float glow = exp(-max(r - rs, 0.0) * 5.2) * (0.42 + uPulse * 0.18) * (1.0 - smoothstep(0.4, 0.9, v));
        col += glow * vec3(0.42);

        // a lone photon on a slightly tilted orbit (relativistic detail)
        float pa = uTime * 0.5;
        vec2 op = hole + rs * 1.7 * vec2(cos(pa), sin(pa) * 0.62);
        col += exp(-dot(p - op, p - op) * 2200.0) * vec3(0.85) * 1.6 * (1.0 - smoothstep(0.3, 0.8, v));

        // a captured star streaking in + spaghettifying as it nears the hole
        if (uStarProg > 0.0) {
          vec2 sp = mix(uStarStart, hole, uStarProg * uStarProg);
          vec2 sd = p - sp;
          vec2 radd = normalize(hole - sp + vec2(1e-4));
          float along = dot(sd, radd);
          float perp = dot(sd, vec2(-radd.y, radd.x));
          float stretch = mix(1.0, 7.0, uStarProg);
          float star = exp(-(along * along / (0.0004 * stretch) + perp * perp / 0.000016));
          col += star * vec3(0.92) * (1.0 - uStarProg);
        }

        // event horizon — pure black core (size never changes)
        col *= 1.0 - smoothstep(rs, rs - 0.012, r);

        // scene birth: a soft central flash, then fade up from black
        col += vec3(0.82) * (1.0 - smoothstep(0.0, 0.18, uBirth)) * 0.8 * exp(-r * 3.0);
        col *= smoothstep(0.0, 0.25, uBirth);

        // vortex drains everything to black
        col *= 1.0 - smoothstep(0.35, 1.0, v);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    uniforms.uAspect.value = w / h;
  };
  resize();
  window.addEventListener("resize", resize);

  // cursor → smoothed mouse + ripple on fast moves
  const mTarget = { x: 0, y: 0 };
  let lastX = 0;
  let lastY = 0;
  let lastT = performance.now();
  let rippleCd = 0; // cooldown
  const triggerRipple = (amp: number) => {
    uniforms.uRippleAge.value = 0;
    uniforms.uRippleAmp.value = amp;
  };
  const onMove = (e: PointerEvent) => {
    mTarget.x = e.clientX / window.innerWidth - 0.5;
    mTarget.y = -(e.clientY / window.innerHeight - 0.5);
    const now = performance.now();
    const dt = Math.max(16, now - lastT);
    const speed = Math.hypot(e.clientX - lastX, e.clientY - lastY) / dt; // px/ms
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = now;
    if (speed > 2.2 && rippleCd <= 0) {
      triggerRipple(Math.min(1, speed * 0.3));
      rippleCd = 0.5;
    }
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  // scroll z-dolly (the intro is scroll-locked, so wheel just pushes the camera in)
  let dolly = 0;
  let dollyTarget = 0;
  const onWheel = (e: WheelEvent) => {
    dollyTarget = Math.min(1, Math.max(0, dollyTarget + e.deltaY * 0.0006));
  };
  window.addEventListener("wheel", onWheel, { passive: true });

  // periodic captured-star event
  let starTimer = 5 + Math.random() * 5;
  let idleRippleTimer = 4.5;

  const timer = new THREE.Timer();
  let elapsed = 0;
  let raf = 0;
  let firstFrame = true;
  const render = () => {
    timer.update();
    const dt = Math.min(0.05, timer.getDelta());
    elapsed += dt;
    uniforms.uTime.value = elapsed;
    uniforms.uMouse.value.x += (mTarget.x - uniforms.uMouse.value.x) * 0.04;
    uniforms.uMouse.value.y += (mTarget.y - uniforms.uMouse.value.y) * 0.04;
    uniforms.uVortex.value = swallow.value.active ? swallow.value.vortex : 0;
    uniforms.uPulse.value = pulse.value;

    // birth ramp 0→1
    if (uniforms.uBirth.value < 1)
      uniforms.uBirth.value = Math.min(1, uniforms.uBirth.value + dt / 1.8);

    // dolly: push in on scroll, spring back to rest
    dollyTarget *= 0.94;
    dolly += (dollyTarget - dolly) * 0.08;
    uniforms.uDolly.value = dolly;

    // ripples: advance + retire; gentle idle pulse
    rippleCd -= dt;
    if (uniforms.uRippleAge.value >= 0) {
      uniforms.uRippleAge.value += dt;
      if (uniforms.uRippleAge.value > 2.6) uniforms.uRippleAge.value = -1;
    }
    idleRippleTimer -= dt;
    if (idleRippleTimer <= 0) {
      idleRippleTimer = 5 + Math.random() * 3;
      if (uniforms.uRippleAge.value < 0) triggerRipple(0.5);
    }

    // captured star: launch periodically, then advance prog 0→1
    starTimer -= dt;
    if (
      starTimer <= 0 &&
      uniforms.uStarProg.value <= 0 &&
      !swallow.value.active
    ) {
      starTimer = 8 + Math.random() * 6;
      const a = Math.PI * 0.5 + Math.random() * Math.PI; // come from the left half
      uniforms.uStarStart.value.set(
        0.34 + Math.cos(a) * 0.95,
        Math.sin(a) * 0.72,
      );
      uniforms.uStarProg.value = 0.0001;
    }
    if (uniforms.uStarProg.value > 0) {
      uniforms.uStarProg.value += dt / 2.4;
      if (uniforms.uStarProg.value >= 1) uniforms.uStarProg.value = 0;
    }

    renderer.render(scene, camera);
    if (firstFrame) {
      firstFrame = false;
      renderer.domElement.style.opacity = "1";
    }
  };
  const loop = () => {
    render();
    raf = requestAnimationFrame(loop);
  };
  const pause = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
  const onVisibility = () => {
    if (document.hidden) pause();
    else if (!raf && !reduced) loop();
  };
  document.addEventListener("visibilitychange", onVisibility);

  if (reduced) render();
  else loop();

  cleanup = () => {
    pause();
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("wheel", onWheel);
    document.removeEventListener("visibilitychange", onVisibility);
    quad.geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
});
</script>

<template>
  <div ref="host" class="h-full w-full" aria-hidden="true" />
</template>
