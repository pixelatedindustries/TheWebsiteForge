<script setup lang="ts">
/**
 * Full-screen flowing aurora — a domain-warped fbm-noise shader that animates
 * continuously, drifts toward the cursor, and shifts its palette with scroll
 * (monochrome: gray→silver). Rendered at reduced resolution (it's soft, so it's cheap)
 * and pauses when the tab is hidden. Static first frame under reduced-motion.
 */
const host = ref<HTMLDivElement | null>(null);
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

  const reduced = shouldReduceMotion();
  const tier = getDeviceTier();
  const OCTAVES = fbmOctaves(tier); // 2 on low-power devices, 4 otherwise
  const SCALE = tier === "low" ? 0.4 : 0.55; // internal render scale

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
  renderer.setPixelRatio(1);
  el.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, {
    width: "100%",
    height: "100%",
    display: "block",
  });

  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uScroll: { value: 0 },
    uAspect: { value: 1 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime; uniform vec2 uMouse; uniform float uScroll; uniform float uAspect;
      varying vec2 vUv;

      float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        float a = hash(i), b = hash(i+vec2(1.0,0.0)), c = hash(i+vec2(0.0,1.0)), d = hash(i+vec2(1.0,1.0));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
      }
      float fbm(vec2 p){
        float s = 0.0, a = 0.5;
        mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
        for(int i = 0; i < ${OCTAVES}; i++){ s += a*noise(p); p = m*p; a *= 0.5; }
        return s;
      }
      void main(){
        vec2 uv = vUv;
        uv.x *= uAspect;
        vec2 p = uv*2.2 + uMouse*0.35;
        float t = uTime*0.05;

        // domain warp → flowing filaments
        vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2,1.3) - t));
        vec2 r = vec2(fbm(p + 3.5*q + vec2(1.7,9.2) + 0.4*t),
                      fbm(p + 3.5*q + vec2(8.3,2.8) - 0.4*t));
        float f = fbm(p + 3.5*r);

        vec3 base = vec3(0.02);
        vec3 emerald = vec3(0.3);
        vec3 cyan    = vec3(0.42);
        vec3 blue    = vec3(0.2);
        vec3 indigo  = vec3(0.24);

        vec3 hi = mix(emerald, cyan, smoothstep(0.0, 0.45, uScroll));
        hi = mix(hi, mix(blue, indigo, 0.45), smoothstep(0.45, 1.0, uScroll));

        vec3 col = base;
        col = mix(col, hi, clamp(f*f*1.15, 0.0, 1.0));
        col += hi * pow(clamp(length(r) - 0.2, 0.0, 1.0), 2.0) * 0.4;
        col *= 0.82; // keep it dark enough for legible text on top

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
    renderer.setSize(Math.ceil(w * SCALE), Math.ceil(h * SCALE), false);
    uniforms.uAspect.value = w / h;
  };
  resize();
  window.addEventListener("resize", resize);

  // cursor drift (lerped)
  const mTarget = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    mTarget.x = e.clientX / window.innerWidth - 0.5;
    mTarget.y = -(e.clientY / window.innerHeight - 0.5);
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  // scroll palette (lerped)
  let scrollTarget = 0;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollTarget = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const clock = new THREE.Clock();
  let raf = 0;
  const render = () => {
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uMouse.value.x += (mTarget.x - uniforms.uMouse.value.x) * 0.04;
    uniforms.uMouse.value.y += (mTarget.y - uniforms.uMouse.value.y) * 0.04;
    uniforms.uScroll.value += (scrollTarget - uniforms.uScroll.value) * 0.06;
    renderer.render(scene, camera);
  };
  const loop = () => {
    render();
    raf = requestAnimationFrame(loop);
  };
  const play = () => {
    if (!raf) loop();
  };
  const pause = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
  let onScreen = true;
  const onVisibility = () => {
    if (document.hidden || !onScreen) pause();
    else play();
  };
  document.addEventListener("visibilitychange", onVisibility);

  // Pause the render loop while the field is scrolled out of view, not just
  // when the tab is hidden — saves GPU on long pages (issues.md #6).
  const io = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      if (reduced) return;
      if (onScreen && !document.hidden) play();
      else pause();
    },
    { threshold: 0.01 },
  );
  io.observe(el);

  if (reduced) render();
  else loop();

  cleanup = () => {
    pause();
    io.disconnect();
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("visibilitychange", onVisibility);
    quad.geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
});
</script>

<template>
  <div ref="host" class="absolute inset-0 h-full w-full" aria-hidden="true" />
</template>
