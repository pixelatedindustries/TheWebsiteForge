import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import {
  cappedPixelRatio,
  getDeviceTier,
  shouldReduceMotion,
} from "~/utils/deviceTier";

export interface GlassShardSceneOptions {
  canvas: HTMLCanvasElement;
  visibilityTarget: HTMLElement;
  scrollTrigger: HTMLElement;
  scrollEndTrigger: HTMLElement;
  backgroundColor?: string;
  glassColor?: string;
  edgeLightColor?: string;
  ambientIntensity?: number;
  pointLightIntensity?: number;
  transmission?: number;
  roughness?: number;
  thickness?: number;
  scrub?: number;
  shardCount?: number;
  shardSizeMin?: number;
  shardSizeMax?: number;
  introColor?: string;
  logoOffsetX?: number;
  introHold?: number;
  introDuration?: number;
  explosion?: number;
  hoverLift?: number;
  hoverDrift?: number;
  hoverRotation?: number;
  hoverSpring?: number;
}

interface Shard {
  mesh: THREE.Mesh;
  introPosition: THREE.Vector3;
  introClumpPosition: THREE.Vector3;
  assembledPosition: THREE.Vector3;
  explodedPosition: THREE.Vector3;
  assembledRotation: THREE.Euler;
  explodedRotation: THREE.Euler;
  roughScale: THREE.Vector3;
  floatPhase: number;
  floatSpeed: number;
  floatAmplitude: THREE.Vector3;
  scrollPhase: number;
  hoverOffset: THREE.Vector3;
  hoverVelocity: THREE.Vector3;
  flingRotation: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  mass: number;
  persist: boolean;
}

const defaults = {
  backgroundColor: "#0e0d0c",
  glassColor: "#353638",
  edgeLightColor: "#eee9df",
  ambientIntensity: 0.55,
  pointLightIntensity: 32,
  transmission: 0.72,
  roughness: 0.32,
  thickness: 1.3,
  scrub: 1,
  shardCount: 144,
  shardSizeMin: 0.16,
  shardSizeMax: 0.32,
  introColor: "#ffffff",
  logoOffsetX: 2.15,
  introHold: 0.8,
  introDuration: 2.2,
  explosion: 4.8,
  hoverLift: 0.35,
  hoverDrift: 1.1,
  hoverRotation: 0.32,
  hoverSpring: 2.4,
};

export class GlassShardScene {
  private readonly options: Required<
    Omit<
      GlassShardSceneOptions,
      "canvas" | "visibilityTarget" | "scrollTrigger" | "scrollEndTrigger"
    >
  > &
    Pick<
      GlassShardSceneOptions,
      "canvas" | "visibilityTarget" | "scrollTrigger" | "scrollEndTrigger"
    >;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly structure = new THREE.Group();
  private readonly shards: Shard[] = [];
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly materials: THREE.MeshPhysicalMaterial[];
  private readonly glassColor: THREE.Color;
  private readonly introColor: THREE.Color;
  private readonly pointLight: THREE.PointLight;
  private readonly cursorLight: THREE.PointLight;
  private readonly timer = new THREE.Timer();
  private readonly pointerTarget = new THREE.Vector2();
  private readonly pointer = new THREE.Vector2();
  private readonly pointerVelocity = new THREE.Vector2();
  private readonly raycaster = new THREE.Raycaster();
  private readonly propulsionPlane = new THREE.Plane(
    new THREE.Vector3(0, 0, 1),
    0,
  );
  private readonly propulsionPoint = new THREE.Vector3();
  private readonly propulsionDirection = new THREE.Vector3();
  private readonly propulsionForce = new THREE.Vector3();
  private readonly proximityWorldPosition = new THREE.Vector3();
  private readonly proximityClosestPoint = new THREE.Vector3();
  private readonly tempPosition = new THREE.Vector3();
  private readonly tempIntroPosition = new THREE.Vector3();
  private readonly floatOffset = new THREE.Vector3();
  private readonly hoverTarget = new THREE.Vector3();
  private readonly hoverForce = new THREE.Vector3();
  private readonly hoverContact = new THREE.Vector3();
  private readonly hoverWorld = new THREE.Vector3();
  private readonly reducedMotion = shouldReduceMotion();
  private readonly scrollState = {
    assembly: 0,
    cameraX: 0.8,
    cameraY: 0.35,
    cameraZ: 9.5,
    rotationX: -0.22,
    rotationY: -0.55,
    rotationZ: 0.12,
  };
  private readonly introState = { expansion: 0, dispersal: 0 };
  private scrollTween: gsap.core.Tween | null = null;
  private introTween: gsap.core.Timeline | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private environmentTarget: THREE.WebGLRenderTarget | null = null;
  private maxDrawingBufferSize = 4096;
  private raf = 0;
  private onScreen = false;
  private pointerActive = false;
  private lastPointerTime = 0;
  private lastElapsed = 0;
  private scrollDrift = 0;
  private lastAssembly = 0;
  private previousHtmlOverflow = "";
  private previousBodyOverflow = "";
  private introActive = false;
  private disposed = false;

  constructor(options: GlassShardSceneOptions) {
    this.options = { ...defaults, ...options };
    gsap.registerPlugin(ScrollTrigger);

    this.renderer = new THREE.WebGLRenderer({
      canvas: options.canvas,
      alpha: true,
      antialias: getDeviceTier() !== "low",
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(cappedPixelRatio(1.5));
    this.renderer.setClearColor(this.options.backgroundColor, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // The drawing buffer (and the antialiased multisample renderbuffers that
    // back it) cannot exceed the GPU's MAX_RENDERBUFFER_SIZE, which is often
    // smaller than maxTextureSize. Cap by the smaller of the two so large /
    // high-DPI viewports never overflow the renderbuffer limit.
    const gl = this.renderer.getContext();
    const maxRenderbufferSize = gl.getParameter(
      gl.MAX_RENDERBUFFER_SIZE,
    ) as number;
    this.maxDrawingBufferSize = Math.min(
      this.renderer.capabilities.maxTextureSize,
      maxRenderbufferSize || this.renderer.capabilities.maxTextureSize,
    );

    this.glassColor = new THREE.Color(this.options.glassColor);
    this.introColor = new THREE.Color(this.options.introColor);
    this.materials = [
      createObsidianMaterial(this.glassColor, this.options, "#050607"),
      createObsidianMaterial(this.glassColor, this.options, "#111820"),
      createObsidianMaterial(this.glassColor, this.options, "#292015"),
    ];
    this.pointLight = new THREE.PointLight(
      this.options.edgeLightColor,
      this.options.pointLightIntensity,
      14,
      1.6,
    );
    this.cursorLight = new THREE.PointLight(
      "#b8c7d8",
      this.options.pointLightIntensity * 0.42,
      9,
      1.8,
    );

    this.setupScene();
    this.setupScroll();
    this.setupLifecycle();
    this.resize();
    this.setupIntro();
    this.applyScrollState(0);
    this.render();
  }

  private setupScene() {
    this.scene.add(this.structure);
    this.scene.add(
      new THREE.HemisphereLight(
        this.options.edgeLightColor,
        this.options.backgroundColor,
        this.options.ambientIntensity,
      ),
    );
    this.scene.add(this.pointLight);
    this.scene.add(this.cursorLight);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environmentTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.environmentTarget.texture;
    pmrem.dispose();

    const random = mulberry32(71823);
    const shardCount =
      getDeviceTier() === "low"
        ? Math.min(72, this.options.shardCount)
        : this.options.shardCount;
    const introPositions = createCirclePositions(
      shardCount,
      random,
      this.options.logoOffsetX,
    );
    for (let index = 0; index < shardCount; index++) {
      const direction = randomUnitVector(random);
      const depthRoll = random();
      const depthProfile =
        depthRoll < 0.16
          ? {
              z: 2.3 + random() * 2.15,
              size: 1.55 + random() * 1.35,
              spread: 1.18,
              drift: 1.3,
            }
          : depthRoll < 0.57
            ? {
                z: -0.75 + random() * 2.3,
                size: 0.9 + random() * 0.55,
                spread: 1,
                drift: 1,
              }
            : {
                z: -3.8 + random() * 2.15,
                size: 0.48 + random() * 0.48,
                spread: 1.22,
                drift: 0.62,
              };
      const groundX = (random() - 0.5) * 5.4;
      const groundZ = (random() - 0.5) * 1.25;
      const moundHeight =
        Math.pow(Math.max(0, 1 - Math.abs(groundX) / 3), 1.7) * 1.05;
      const assembledPosition = new THREE.Vector3(
        groundX,
        -2.35 + moundHeight * random() + random() * 0.18,
        groundZ,
      );
      const explodedPosition = assembledPosition
        .clone()
        .add(
          direction
            .clone()
            .multiplyScalar(this.options.explosion * (0.65 + random() * 0.8)),
        )
        .add(
          new THREE.Vector3(
            (random() - 0.5) * 2.4 * depthProfile.spread,
            (random() - 0.5) * 2.4 * depthProfile.spread,
            depthProfile.z,
          ),
        );
      explodedPosition.z = THREE.MathUtils.clamp(explodedPosition.z, -8.5, 7.1);

      const sizeProgress = Math.pow(random(), 1.7);
      const shardSize =
        THREE.MathUtils.lerp(
          this.options.shardSizeMin,
          this.options.shardSizeMax,
          sizeProgress,
        ) * depthProfile.size;
      const geometry = createRockGeometry(shardSize, random);
      const roughScale = new THREE.Vector3(
        0.92 + random() * 0.2,
        0.9 + random() * 0.22,
        0.88 + random() * 0.2,
      );
      this.geometries.push(geometry);

      const materialRoll = random();
      const materialIndex =
        materialRoll > 0.91 ? 2 : materialRoll > 0.68 ? 1 : 0;
      const mesh = new THREE.Mesh(geometry, this.materials[materialIndex]);
      const assembledRotation = new THREE.Euler(
        random() * Math.PI,
        random() * Math.PI,
        random() * Math.PI,
      );
      const explodedRotation = new THREE.Euler(
        assembledRotation.x + (random() - 0.5) * 4,
        assembledRotation.y + (random() - 0.5) * 4,
        assembledRotation.z + (random() - 0.5) * 4,
      );
      mesh.position.copy(explodedPosition);
      mesh.rotation.copy(explodedRotation);
      this.structure.add(mesh);
      this.shards.push({
        mesh,
        introPosition: introPositions[index]!,
        introClumpPosition: assembledPosition
          .clone()
          .add(new THREE.Vector3(this.options.logoOffsetX, 0, 0)),
        assembledPosition,
        explodedPosition,
        assembledRotation,
        explodedRotation,
        roughScale,
        floatPhase: random() * Math.PI * 2,
        floatSpeed: (0.36 + random() * 0.42) * depthProfile.drift,
        floatAmplitude: new THREE.Vector3(
          (0.07 + random() * 0.13) * depthProfile.drift,
          (0.1 + random() * 0.18) * depthProfile.drift,
          (0.05 + random() * 0.12) * depthProfile.drift,
        ),
        scrollPhase: index * 0.48 + random() * 1.5,
        hoverOffset: new THREE.Vector3(),
        hoverVelocity: new THREE.Vector3(),
        flingRotation: new THREE.Vector3(),
        angularVelocity: new THREE.Vector3(),
        mass: THREE.MathUtils.clamp(
          Math.pow(shardSize / this.options.shardSizeMin, 2.4) * 0.38,
          0.38,
          2.8,
        ),
        persist: false,
      });
    }

    // Keep only a few rocks alive through the end of the scroll. Every other
    // shard shrinks away as the scene assembles (see applyScrollState), so the
    // footer area stays calm — a handful of shards drifting past instead of a
    // dense pile. The survivors are spread across the view and drift sideways.
    const persistCount = Math.min(3, this.shards.length);
    for (let order = 0; order < persistCount; order++) {
      const shardIndex = Math.floor(
        ((order + 0.5) / persistCount) * this.shards.length,
      );
      const shard = this.shards[shardIndex]!;
      shard.persist = true;
      shard.assembledPosition.set(
        (order - (persistCount - 1) / 2) * 3.4,
        -0.6 + (random() - 0.5) * 0.9,
        -0.4 + (random() - 0.5) * 1.6,
      );
      shard.floatAmplitude.set(0.62, 0.3, 0.26);
      shard.floatSpeed *= 0.7;
    }
  }

  private setupIntro() {
    this.introState.expansion = 1;
    this.introState.dispersal = 1;
  }

  private unlockScroll() {
    if (!this.introActive) return;
    this.introActive = false;
    document.documentElement.style.overflow = this.previousHtmlOverflow;
    document.body.style.overflow = this.previousBodyOverflow;
  }

  private setupScroll() {
    if (this.reducedMotion) {
      this.scrollState.assembly = 1;
      this.scrollState.cameraX = 0;
      this.scrollState.cameraY = 0;
      this.scrollState.cameraZ = 7;
      this.scrollState.rotationX = 0.08;
      this.scrollState.rotationY = Math.PI * 0.8;
      this.scrollState.rotationZ = 0;
      return;
    }

    this.scrollTween = gsap.to(this.scrollState, {
      assembly: 1,
      cameraX: 0,
      cameraY: 0,
      cameraZ: 7,
      rotationX: 0.08,
      rotationY: Math.PI * 0.8,
      rotationZ: 0,
      ease: "none",
      scrollTrigger: {
        trigger: this.options.scrollTrigger,
        endTrigger: this.options.scrollEndTrigger,
        start: "top top",
        end: "bottom bottom",
        scrub: this.options.scrub,
        invalidateOnRefresh: true,
        onUpdate: () => this.requestFrame(),
      },
    });
  }

  private setupLifecycle() {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.options.canvas);

    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.onScreen = entry?.isIntersecting ?? false;
        if (this.reducedMotion && this.onScreen) this.render();
        else if (this.onScreen && !document.hidden) this.play();
        else this.pause();
      },
      { threshold: 0.01 },
    );
    this.intersectionObserver.observe(this.options.visibilityTarget);
    window.addEventListener("pointermove", this.onPointerMove, {
      passive: true,
    });
    document.documentElement.addEventListener(
      "pointerleave",
      this.onPointerLeave,
    );
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  private readonly onPointerMove = (event: PointerEvent) => {
    const now = performance.now();
    const nextX = (event.clientX / window.innerWidth) * 2 - 1;
    const nextY = -(event.clientY / window.innerHeight) * 2 + 1;
    const deltaSeconds = Math.max(1 / 240, (now - this.lastPointerTime) / 1000);

    this.pointerVelocity.set(
      (nextX - this.pointerTarget.x) / deltaSeconds,
      (nextY - this.pointerTarget.y) / deltaSeconds,
    );
    this.pointerVelocity.clampLength(0, 14);
    this.pointerActive = true;
    this.lastPointerTime = now;
    this.pointerTarget.set(nextX, nextY);
  };

  private readonly onPointerLeave = () => {
    this.pointerActive = false;
    this.pointerVelocity.set(0, 0);
  };

  private readonly onVisibilityChange = () => {
    if (document.hidden || !this.onScreen) this.pause();
    else this.play();
  };

  private resize() {
    const width = this.options.canvas.clientWidth;
    const height = this.options.canvas.clientHeight;
    if (!width || !height) return;
    // Clamp the effective pixel ratio so the drawing buffer (and the internal,
    // multisampled transmission render target three derives from it) never
    // exceeds the GPU's max renderbuffer size. The ratio is allowed to fall
    // BELOW 1 when the CSS viewport alone would overflow that limit — this
    // happens on software-fallback contexts (small MAX_RENDERBUFFER_SIZE) that
    // the browser hands out once other routes have exhausted the WebGL context
    // budget, which is why direct loads work but client navigation didn't.
    const largestEdge = Math.max(width, height);
    const ratioForLimit = this.maxDrawingBufferSize / largestEdge;
    const safePixelRatio = Math.max(
      0.1,
      Math.min(cappedPixelRatio(1.5), ratioForLimit),
    );
    this.renderer.setPixelRatio(safePixelRatio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.requestFrame();
  }

  private applyScrollState(elapsed: number) {
    const progress = this.scrollState.assembly;
    // As the scene assembles toward the footer, fade out every non-persistent
    // shard so the bottom of the page isn't a dense pile of rocks.
    const endVanish = THREE.MathUtils.smoothstep(progress, 0.6, 0.94);
    const introExpansion = THREE.MathUtils.smoothstep(
      this.introState.expansion,
      0,
      1,
    );
    const introProgress = THREE.MathUtils.smoothstep(
      this.introState.dispersal,
      0,
      1,
    );
    const roughProgress = THREE.MathUtils.smoothstep(introProgress, 0.08, 0.92);
    const looseness = 1 - progress;
    const delta = Math.min(0.04, Math.max(0.001, elapsed - this.lastElapsed));
    this.lastElapsed = elapsed;
    const assemblyVelocity = THREE.MathUtils.clamp(
      (progress - this.lastAssembly) / delta,
      -1.4,
      1.4,
    );
    this.lastAssembly = progress;
    this.scrollDrift = THREE.MathUtils.lerp(
      this.scrollDrift,
      assemblyVelocity,
      1 - Math.exp(-2.4 * delta),
    );

    this.pointer.lerp(this.pointerTarget, 0.055);
    this.pointerVelocity.multiplyScalar(Math.exp(-5.5 * delta));

    for (const [index, material] of this.materials.entries()) {
      const finalColor = material.userData.finalColor as THREE.Color;
      material.color.copy(this.introColor).lerp(finalColor, roughProgress);
      material.attenuationColor
        .copy(this.introColor)
        .lerp(finalColor, roughProgress);
      material.metalness = THREE.MathUtils.lerp(
        0.02,
        index === 0 ? 0.12 : 0.2,
        roughProgress,
      );
      material.roughness = THREE.MathUtils.lerp(
        0.2,
        Math.max(0.4, this.options.roughness + index * 0.035),
        roughProgress,
      );
      material.transmission = THREE.MathUtils.lerp(
        0.03,
        Math.min(index === 0 ? 0.16 : 0.1, this.options.transmission),
        roughProgress,
      );
      material.emissiveIntensity =
        (index === 0 ? 0 : 0.045 + Math.sin(elapsed * 0.65 + index) * 0.018) *
        roughProgress;
    }

    this.camera.position.set(
      this.scrollState.cameraX * introProgress,
      this.scrollState.cameraY * introProgress,
      THREE.MathUtils.lerp(9, this.scrollState.cameraZ, introProgress),
    );
    this.camera.lookAt(0, 0, 0);
    this.structure.rotation.set(
      (this.scrollState.rotationX +
        Math.sin(elapsed * 0.18) * 0.025 * looseness) *
        introProgress,
      (this.scrollState.rotationY + elapsed * 0.035 * looseness) *
        introProgress,
      this.scrollState.rotationZ * introProgress,
    );

    for (const shard of this.shards) {
      const floatTime = elapsed * shard.floatSpeed + shard.floatPhase;
      const idleStrength = (0.38 + looseness * 0.62) * roughProgress;
      const driftStrength =
        this.scrollDrift * (0.18 + looseness * 0.42) * roughProgress;
      this.floatOffset.set(
        (Math.sin(floatTime * 0.73) * shard.floatAmplitude.x +
          Math.sin(shard.scrollPhase) * driftStrength * 0.08) *
          idleStrength,
        (Math.cos(floatTime) * shard.floatAmplitude.y +
          Math.cos(shard.scrollPhase * 0.62) * driftStrength * 0.14) *
          idleStrength,
        (Math.sin(floatTime * 0.51 + 1.7) * shard.floatAmplitude.z +
          Math.sin(shard.scrollPhase * 0.41) * driftStrength * 0.06) *
          idleStrength,
      );
      this.tempPosition.lerpVectors(
        shard.explodedPosition,
        shard.assembledPosition,
        progress,
      );
      this.tempIntroPosition.copy(shard.introPosition);
      this.tempIntroPosition.lerp(shard.introClumpPosition, introExpansion);
      this.tempPosition.lerpVectors(
        this.tempIntroPosition,
        this.tempPosition,
        introProgress,
      );
      this.tempPosition.add(this.floatOffset);
      shard.mesh.position.copy(this.tempPosition);
      shard.mesh.rotation.set(
        THREE.MathUtils.lerp(
          0,
          THREE.MathUtils.lerp(
            shard.explodedRotation.x,
            shard.assembledRotation.x,
            progress,
          ),
          roughProgress,
        ),
        THREE.MathUtils.lerp(
          0,
          THREE.MathUtils.lerp(
            shard.explodedRotation.y,
            shard.assembledRotation.y,
            progress,
          ),
          roughProgress,
        ),
        THREE.MathUtils.lerp(
          0,
          THREE.MathUtils.lerp(
            shard.explodedRotation.z,
            shard.assembledRotation.z,
            progress,
          ),
          roughProgress,
        ),
      );
      shard.mesh.rotation.x +=
        Math.sin(floatTime * 0.42) * 0.035 * idleStrength;
      shard.mesh.rotation.y +=
        Math.cos(floatTime * 0.36 + shard.scrollPhase) * 0.045 * idleStrength +
        driftStrength * 0.018;
      shard.mesh.rotation.z +=
        Math.sin(floatTime * 0.31 + 2.1) * 0.025 * idleStrength;
    }

    this.structure.updateMatrixWorld(true);
    this.raycaster.setFromCamera(this.pointerTarget, this.camera);
    const intersection =
      this.pointerActive && !this.introActive
        ? this.raycaster.intersectObjects(
            this.shards.map((shard) => shard.mesh),
            false,
          )[0]
        : undefined;
    const hoveredMesh = intersection?.object ?? null;
    if (intersection) {
      this.hoverContact.copy(intersection.point);
      this.structure.worldToLocal(this.hoverContact);
    }

    const propulsionSpeed = this.pointerVelocity.length();
    const propulsionActive =
      this.pointerActive &&
      !this.introActive &&
      this.raycaster.ray.intersectPlane(
        this.propulsionPlane,
        this.propulsionPoint,
      ) !== null;
    if (propulsionActive) {
      this.structure.worldToLocal(this.propulsionPoint);
      this.propulsionDirection
        .set(this.pointerVelocity.x, this.pointerVelocity.y, 0.08)
        .normalize();
      const thrust = THREE.MathUtils.clamp(propulsionSpeed * 1.35, 0, 12);
      const fieldRadius = 1.75 + Math.min(0.75, propulsionSpeed * 0.06);
      const proximityRadius = 0.82;

      for (const shard of this.shards) {
        const distance = shard.mesh.position.distanceTo(this.propulsionPoint);
        shard.mesh.getWorldPosition(this.proximityWorldPosition);
        this.raycaster.ray.closestPointToPoint(
          this.proximityWorldPosition,
          this.proximityClosestPoint,
        );
        const proximityDistance = this.proximityWorldPosition.distanceTo(
          this.proximityClosestPoint,
        );
        if (distance >= fieldRadius && proximityDistance >= proximityRadius)
          continue;
        const falloff =
          distance < fieldRadius
            ? Math.pow(1 - distance / fieldRadius, 2.2)
            : 0;
        const proximityFalloff =
          proximityDistance < proximityRadius
            ? Math.pow(1 - proximityDistance / proximityRadius, 1.45)
            : 0;
        const proximityThrust = 8.5 * proximityFalloff;
        this.structure.worldToLocal(this.proximityClosestPoint);
        this.propulsionForce
          .subVectors(shard.mesh.position, this.proximityClosestPoint)
          .normalize()
          .multiplyScalar(proximityThrust + thrust * falloff * 0.22)
          .addScaledVector(this.propulsionDirection, thrust * falloff * 0.78);
        shard.hoverVelocity.addScaledVector(
          this.propulsionForce,
          delta / shard.mass,
        );
        shard.angularVelocity.x +=
          (-this.pointerVelocity.y * falloff * delta * 1.6 +
            proximityFalloff * delta * 0.8) /
          shard.mass;
        shard.angularVelocity.y +=
          (this.pointerVelocity.x * falloff * delta * 1.6 +
            proximityFalloff * delta * 1.1) /
          shard.mass;
        shard.angularVelocity.z +=
          ((this.pointerVelocity.x - this.pointerVelocity.y) *
            falloff *
            delta *
            0.7) /
          shard.mass;
      }
    }

    for (const shard of this.shards) {
      this.hoverTarget.set(0, 0, 0);
      const returnStrength = shard.hoverOffset.lengthSq() > 9 ? 0.11 : 0.055;
      this.hoverForce
        .subVectors(this.hoverTarget, shard.hoverOffset)
        .multiplyScalar(returnStrength * delta);
      shard.hoverVelocity.add(this.hoverForce);
      shard.hoverVelocity.multiplyScalar(Math.exp(-0.12 * delta));
      shard.hoverVelocity.clampLength(0, 7 / Math.sqrt(shard.mass));
      shard.hoverOffset.addScaledVector(shard.hoverVelocity, delta);
      shard.hoverOffset.clampLength(0, 8.5);
      shard.angularVelocity.addScaledVector(
        shard.flingRotation,
        -0.055 * delta,
      );
      shard.angularVelocity.multiplyScalar(Math.exp(-0.08 * delta));
      shard.angularVelocity.clampLength(0, 9 / Math.sqrt(shard.mass));
      shard.flingRotation.addScaledVector(shard.angularVelocity, delta);

      shard.mesh.position.add(shard.hoverOffset);
      shard.mesh.rotation.x += shard.flingRotation.x;
      shard.mesh.rotation.y += shard.flingRotation.y;
      shard.mesh.rotation.z += shard.flingRotation.z;
      const hoverScale = Math.min(0.035, shard.hoverOffset.length() * 0.018);
      const introScale = THREE.MathUtils.lerp(0.34, 0.76, introExpansion);
      const persistScale = shard.persist ? 1 : 1 - endVanish;
      shard.mesh.scale.set(
        (THREE.MathUtils.lerp(introScale, shard.roughScale.x, roughProgress) +
          hoverScale) *
          persistScale,
        (THREE.MathUtils.lerp(introScale, shard.roughScale.y, roughProgress) +
          hoverScale) *
          persistScale,
        (THREE.MathUtils.lerp(introScale, shard.roughScale.z, roughProgress) +
          hoverScale) *
          persistScale,
      );
    }

    this.pointLight.position.set(
      Math.cos(elapsed * 0.34) * 4.5,
      1.7 + Math.sin(elapsed * 0.22) * 1.5,
      Math.sin(elapsed * 0.34) * 4.5,
    );
    if (hoveredMesh) {
      hoveredMesh.getWorldPosition(this.hoverWorld);
      this.hoverWorld.z += 2.5;
      this.cursorLight.position.lerp(this.hoverWorld, 0.16);
    }
    this.cursorLight.intensity = THREE.MathUtils.lerp(
      this.cursorLight.intensity,
      hoveredMesh ? this.options.pointLightIntensity * 0.7 : 0,
      0.12,
    );
  }

  private render = () => {
    if (this.disposed) return;
    // Skip rendering when the canvas has no layout size (e.g. during a
    // client-side route transition before the element is measured). Rendering
    // into a zero-size framebuffer triggers "Attachment has zero size" errors.
    if (!this.options.canvas.clientWidth || !this.options.canvas.clientHeight) {
      return;
    }
    this.timer.update();
    this.applyScrollState(this.timer.getElapsed());
    this.renderer.render(this.scene, this.camera);
  };

  private loop = () => {
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };

  private play() {
    if (this.reducedMotion) {
      this.render();
      return;
    }
    if (!this.raf && !this.disposed) this.loop();
  }

  private pause() {
    if (!this.raf) return;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private requestFrame() {
    if (!this.raf && this.onScreen && !document.hidden) this.render();
  }

  refresh() {
    if (this.disposed) return;
    this.resize();
    ScrollTrigger.refresh();
    const rect = this.options.visibilityTarget.getBoundingClientRect();
    this.onScreen = rect.bottom > 0 && rect.top < window.innerHeight;
    this.render();
    if (this.onScreen && !document.hidden) this.play();
  }

  dispose() {
    this.disposed = true;
    this.pause();
    this.scrollTween?.scrollTrigger?.kill();
    this.scrollTween?.kill();
    this.introTween?.kill();
    this.unlockScroll();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    window.removeEventListener("pointermove", this.onPointerMove);
    document.documentElement.removeEventListener(
      "pointerleave",
      this.onPointerLeave,
    );
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.environmentTarget?.dispose();
    this.renderer.dispose();
    // dispose() frees GPU resources but leaves the WebGL context alive until
    // GC. Release it explicitly so navigating between WebGL routes doesn't
    // exhaust the browser's context budget and force a software fallback.
    this.renderer.forceContextLoss();
  }
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createObsidianMaterial(
  glassColor: THREE.Color,
  options: Pick<
    GlassShardSceneOptions,
    "roughness" | "transmission" | "thickness"
  >,
  emissive: string,
) {
  const material = new THREE.MeshPhysicalMaterial({
    color: glassColor,
    emissive,
    emissiveIntensity: 0,
    metalness: 0.08,
    roughness: Math.max(0.46, options.roughness ?? defaults.roughness),
    transmission: Math.min(0.18, options.transmission ?? defaults.transmission),
    thickness: (options.thickness ?? defaults.thickness) * 0.7,
    ior: 1.42,
    clearcoat: 0.58,
    clearcoatRoughness: 0.28,
    attenuationColor: glassColor,
    attenuationDistance: 1.8,
    flatShading: true,
  });
  material.userData.finalColor = new THREE.Color(
    emissive === "#111820"
      ? "#303942"
      : emissive === "#292015"
        ? "#39332c"
        : glassColor,
  );
  return material;
}

function createRockGeometry(size: number, random: () => number) {
  const points: THREE.Vector3[] = [];
  const pointCount = 15 + Math.floor(random() * 7);
  const archetype = random();
  const axes =
    archetype > 0.78
      ? new THREE.Vector3(
          1.08 + random() * 0.2,
          0.58 + random() * 0.14,
          0.82 + random() * 0.2,
        )
      : archetype > 0.55
        ? new THREE.Vector3(
            1.12 + random() * 0.2,
            0.82 + random() * 0.2,
            0.64 + random() * 0.14,
          )
        : new THREE.Vector3(
            0.9 + random() * 0.22,
            0.84 + random() * 0.24,
            0.8 + random() * 0.22,
          );
  const offset = new THREE.Vector3(
    (random() - 0.5) * 0.12,
    (random() - 0.5) * 0.12,
    (random() - 0.5) * 0.12,
  );

  for (let index = 0; index < pointCount; index++) {
    const direction = randomUnitVector(random);
    const radius = size * (0.78 + random() * 0.3);
    points.push(
      direction
        .multiply(axes)
        .multiplyScalar(radius)
        .addScaledVector(offset, size),
    );
  }

  // Six anchors keep the hull substantial while the random points create chips.
  points.push(
    new THREE.Vector3(size * axes.x, 0, 0),
    new THREE.Vector3(-size * axes.x, 0, 0),
    new THREE.Vector3(0, size * axes.y, 0),
    new THREE.Vector3(0, -size * axes.y, 0),
    new THREE.Vector3(0, 0, size * axes.z),
    new THREE.Vector3(0, 0, -size * axes.z),
  );

  const rock = new ConvexGeometry(points);
  rock.computeVertexNormals();
  rock.computeBoundingSphere();
  return rock;
}

function randomUnitVector(random: () => number) {
  const y = random() * 2 - 1;
  const angle = random() * Math.PI * 2;
  const radius = Math.sqrt(1 - y * y);
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    y,
    Math.sin(angle) * radius,
  );
}

function createCirclePositions(
  count: number,
  random: () => number,
  offsetX: number,
) {
  const positions: THREE.Vector3[] = [];

  for (let index = 0; index < count; index++) {
    const angle = index * Math.PI * (3 - Math.sqrt(5));
    const radius = Math.sqrt((index + 0.5) / count) * 0.46;
    positions.push(
      new THREE.Vector3(
        offsetX + Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        (random() - 0.5) * 0.16,
      ),
    );
  }

  return positions;
}
