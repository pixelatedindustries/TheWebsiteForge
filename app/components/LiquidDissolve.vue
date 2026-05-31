<script setup lang="ts">
/**
 * WebGL liquid-dissolve page transition (intro → /home).
 * A full-screen molten field floods IN over the page (organic noise coverage),
 * the route swaps hidden behind it, then it dissolves OUT with flowing edges to
 * reveal the new page. Driven by the shared `liquidTransition` state:
 *   { active, progress }  — progress 0 → 1, coverage peaks at 0.5 (swap point).
 */
const liquid = useState<{ active: boolean; progress: number }>(
  "liquidTransition",
  () => ({ active: false, progress: 0 }),
);

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
  const THREE = await import("three"); // already cached (the orb uses it)
  if (disposed || !host.value) return;

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  el.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, {
    width: "100%",
    height: "100%",
    display: "block",
  });

  const uniforms = {
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uAspect: { value: 1 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uProgress; uniform float uTime; uniform float uAspect;
      varying vec2 vUv;

      float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        float a=hash(i), b=hash(i+vec2(1.0,0.0)), c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
      }
      float fbm(vec2 p){
        float s=0.0, a=0.5;
        mat2 m = mat2(1.6,1.2,-1.2,1.6);
        for(int i=0;i<5;i++){ s += a*noise(p); p = m*p; a *= 0.5; }
        return s;
      }
      void main(){
        vec2 uv = vUv; uv.x *= uAspect;
        vec2 p = uv * 2.6;
        float t = uTime * 0.22;

        // flowing, domain-warped field
        vec2 q = vec2(fbm(p + t), fbm(p + vec2(3.1,1.7) - t));
        float n = fbm(p + 2.4*q);
        n = clamp(n*0.92 + 0.04, 0.0, 1.0);

        // coverage sweeps 0 → 1 → 0; *1.18 guarantees a fully-covered peak
        float sweep = (1.0 - abs(uProgress*2.0 - 1.0)) * 1.18;
        float w = 0.17;
        float alpha = smoothstep(n - w, n + w, sweep);

        // glowing molten rim where the liquid edge is dissolving
        float rim = 1.0 - abs(alpha*2.0 - 1.0);

        vec3 deep = vec3(0.02, 0.05, 0.09);
        vec3 teal = vec3(0.06, 0.72, 0.55);
        vec3 cyan = vec3(0.18, 0.78, 0.95);
        vec3 col = mix(deep, mix(teal, cyan, n), 0.62);
        col += rim * vec3(0.45, 0.95, 0.9) * 1.25;

        gl_FragColor = vec4(col, alpha);
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

  const clock = new THREE.Clock();
  let raf = 0;
  const render = () => {
    uniforms.uProgress.value = liquid.value.progress;
    uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
  };
  const loop = () => {
    render();
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  watch(
    () => liquid.value.active,
    (active) => {
      if (active) {
        el.style.opacity = "1";
        resize();
        if (!raf) loop();
      } else {
        stop();
        el.style.opacity = "0";
      }
    },
    { immediate: true },
  );

  cleanup = () => {
    stop();
    window.removeEventListener("resize", resize);
    quad.geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
});
</script>

<template>
  <div
    ref="host"
    class="pointer-events-none fixed inset-0 z-80"
    style="opacity: 0"
    aria-hidden="true"
  />
</template>
