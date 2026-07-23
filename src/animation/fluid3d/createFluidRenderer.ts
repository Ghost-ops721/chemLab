/**
 * Imperative Three.js fluid column for a single vessel well.
 * Dynamic-imported only from client components — never touch window at module top.
 */

import type { FluidState } from "./types";

const MAX_PARTICLES = 48;
const IDLE_FPS = 12;
const ACTIVE_FPS = 60;

export interface FluidRendererHandle {
  setState: (state: FluidState) => void;
  setActive: (active: boolean) => void;
  dispose: () => void;
}

function parseColor(
  THREE: typeof import("three"),
  hex: string,
): InstanceType<typeof import("three").Color> {
  try {
    return new THREE.Color(hex);
  } catch {
    return new THREE.Color("#8fc0b5");
  }
}

function impulseEnergy(state: FluidState, now: number): number {
  let e = 0;
  for (const imp of state.impulses) {
    const age = now - imp.at;
    if (age < 0 || age > imp.durationMs) continue;
    const t = 1 - age / imp.durationMs;
    e = Math.max(e, imp.strength * t * t);
  }
  return e;
}

export async function createFluidRenderer(
  canvas: HTMLCanvasElement,
): Promise<FluidRendererHandle | null> {
  const THREE = await import("three");

  let renderer: InstanceType<typeof THREE.WebGLRenderer>;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
      failIfMajorPerformanceCaveat: false,
    });
  } catch {
    return null;
  }

  if (!renderer.getContext()) {
    renderer.dispose();
    return null;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-0.55, 0.55, 0.75, -0.75, 0.1, 10);
  camera.position.set(0.15, 0.08, 2.2);
  camera.lookAt(0, 0, 0);

  const uniforms = {
    uTime: { value: 0 },
    uFill: { value: 0.4 },
    uColor: { value: new THREE.Color("#8fc0b5") },
    uLayer0: { value: new THREE.Color("#8fc0b5") },
    uLayer1: { value: new THREE.Color("#8fc0b5") },
    uLayer2: { value: new THREE.Color("#8fc0b5") },
    uLayer3: { value: new THREE.Color("#8fc0b5") },
    uLayerCount: { value: 1 },
    uTurbidity: { value: 0 },
    uFoam: { value: 0 },
    uViscosity: { value: 0.2 },
    uWaveAmp: { value: 0.02 },
    uSolidify: { value: 0 },
    uMelt: { value: 0 },
    uTemp: { value: 0 },
  };

  const liquidMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vY;
      uniform float uTime;
      uniform float uFill;
      uniform float uWaveAmp;
      uniform float uViscosity;
      void main() {
        vUv = uv;
        float damp = mix(1.0, 0.35, uViscosity);
        float wave = sin(position.x * 9.0 + uTime * mix(2.8, 1.1, uViscosity)) * uWaveAmp * damp
          + sin(position.x * 15.0 + uTime * 3.4) * uWaveAmp * 0.35 * damp;
        // Remap geometry y [-0.5,0.5] → liquid column [-0.5, -0.5+fill]
        float ny = position.y + 0.5;
        vec3 p = position;
        p.y = -0.5 + ny * max(uFill, 0.001);
        if (ny > 0.9) {
          p.y += wave;
        }
        vY = ny;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision mediump float;
      varying vec2 vUv;
      varying float vY;
      uniform vec3 uColor;
      uniform vec3 uLayer0;
      uniform vec3 uLayer1;
      uniform vec3 uLayer2;
      uniform vec3 uLayer3;
      uniform float uLayerCount;
      uniform float uTurbidity;
      uniform float uFoam;
      uniform float uSolidify;
      uniform float uMelt;
      uniform float uTime;
      uniform float uTemp;

      vec3 layerColor(float y) {
        if (uLayerCount < 1.5) return uColor;
        float bands = max(uLayerCount, 1.0);
        float idx = floor(y * bands);
        if (idx < 0.5) return uLayer0;
        if (idx < 1.5) return uLayer1;
        if (idx < 2.5) return uLayer2;
        return uLayer3;
      }

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      void main() {
        float y = clamp(vY, 0.0, 1.0);
        vec3 base = layerColor(y);
        // Soft vertical lighting
        float shade = 0.78 + 0.22 * y;
        float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
        base *= shade;

        // Turbidity haze
        float n = hash(vUv * 40.0 + uTime * 0.15);
        base = mix(base, base * 0.55 + vec3(0.35, 0.38, 0.34) * n, uTurbidity * 0.75);

        // Foam band near surface
        float foamBand = smoothstep(0.78, 0.98, y) * uFoam;
        base = mix(base, vec3(0.92, 0.96, 0.94), foamBand * 0.85);

        // Solidify → matte; melt → glossier
        float alpha = mix(0.82, 0.95, uSolidify) * edge;
        alpha *= mix(1.0, 0.88, uMelt * 0.4);
        float gloss = mix(0.25, 0.08, uSolidify) + uMelt * 0.15;
        float spec = pow(1.0 - abs(vUv.x - 0.35), 8.0) * gloss;
        base += vec3(spec);

        // Heat shimmer tint
        base = mix(base, base + vec3(0.08, 0.03, 0.0), uTemp * 0.25);

        if (y < 0.001) discard;
        gl_FragColor = vec4(base, alpha);
      }
    `,
  });

  const liquidGeo = new THREE.PlaneGeometry(0.92, 1.0, 24, 16);
  const liquid = new THREE.Mesh(liquidGeo, liquidMat);
  liquid.position.z = 0;
  scene.add(liquid);

  // Side depth plane for slight 3D thickness (shares uniforms)
  const side = new THREE.Mesh(
    new THREE.PlaneGeometry(0.18, 1.0, 4, 12),
    liquidMat,
  );
  side.rotation.y = Math.PI * 0.42;
  side.position.set(0.38, 0, -0.12);
  scene.add(side);

  const particleCount = MAX_PARTICLES;
  const positions = new Float32Array(particleCount * 3);
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.035,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  particles.visible = false;
  scene.add(particles);

  const particlePhase = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    particlePhase[i] = Math.random();
    positions[i * 3] = (Math.random() - 0.5) * 0.7;
    positions[i * 3 + 1] = -0.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
  }

  let state: FluidState = {
    fill: 0,
    layers: [{ color: "#8fc0b5", fraction: 1 }],
    viscosity: 0.2,
    turbidity: 0,
    foam: 0,
    temperature: 0,
    impulses: [],
    fillColor: "#8fc0b5",
    boil: false,
    bubble: false,
    melt: 0,
    solidify: 0,
  };
  let active = true;
  let raf = 0;
  let disposed = false;
  let t0 = 0;
  let lastFrame = 0;

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
  };
  resize();

  const applyState = (s: FluidState) => {
    state = s;
    const fill01 = Math.max(0, Math.min(1, s.fill / 100));
    uniforms.uFill.value = fill01;
    uniforms.uColor.value = parseColor(THREE, s.fillColor);
    uniforms.uTurbidity.value = s.turbidity;
    uniforms.uFoam.value = s.foam;
    uniforms.uViscosity.value = s.viscosity;
    uniforms.uSolidify.value = s.solidify;
    uniforms.uMelt.value = s.melt;
    uniforms.uTemp.value = s.temperature;

    const layers = s.layers.slice(0, 4);
    uniforms.uLayerCount.value = Math.max(1, layers.length);
    uniforms.uLayer0.value = parseColor(THREE, layers[0]?.color ?? s.fillColor);
    uniforms.uLayer1.value = parseColor(
      THREE,
      layers[1]?.color ?? layers[0]?.color ?? s.fillColor,
    );
    uniforms.uLayer2.value = parseColor(
      THREE,
      layers[2]?.color ?? layers[0]?.color ?? s.fillColor,
    );
    uniforms.uLayer3.value = parseColor(
      THREE,
      layers[3]?.color ?? layers[0]?.color ?? s.fillColor,
    );

    const showParticles = s.boil || s.bubble || s.foam > 0.2;
    particles.visible = showParticles && fill01 > 0.04;
    particleMat.opacity = 0.35 + s.foam * 0.35 + (s.boil ? 0.2 : 0);
  };

  const tick = (nowMs: number) => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    if (!active) return;

    const wall = performance.now();
    const impulse = impulseEnergy(state, Date.now());
    const energetic =
      impulse > 0.05 ||
      state.boil ||
      state.bubble ||
      state.foam > 0.15 ||
      state.temperature > 0.4 ||
      state.turbidity > 0.3;

    const targetFps = energetic ? ACTIVE_FPS : IDLE_FPS;
    const minDelta = 1000 / targetFps;
    if (wall - lastFrame < minDelta) return;
    lastFrame = wall;

    if (!t0) t0 = nowMs;
    const t = (nowMs - t0) / 1000;
    uniforms.uTime.value = t;

    const fill01 = uniforms.uFill.value as number;
    const waveBase =
      0.012 +
      impulse * 0.08 +
      state.temperature * 0.025 +
      (state.boil ? 0.03 : 0);
    uniforms.uWaveAmp.value = waveBase * (1 - state.viscosity * 0.55);

    if (particles.visible) {
      const count = Math.min(
        particleCount,
        state.boil || state.bubble ? 36 : 16,
      );
      const attr = particleGeo.getAttribute("position") as InstanceType<
        typeof THREE.BufferAttribute
      >;
      const arr = attr.array as Float32Array;
      const speed = state.boil ? 0.55 : 0.28;
      for (let i = 0; i < count; i++) {
        let phase = (particlePhase[i]! + speed * (minDelta / 1000) * (0.6 + (i % 5) * 0.1)) % 1;
        particlePhase[i] = phase;
        const x = ((i * 0.17) % 1) * 0.7 - 0.35 + Math.sin(t + i) * 0.02;
        const y = -0.5 + fill01 * phase;
        arr[i * 3] = x;
        arr[i * 3 + 1] = y;
        arr[i * 3 + 2] = ((i % 3) - 1) * 0.04;
      }
      // Park unused
      for (let i = count; i < particleCount; i++) {
        arr[i * 3 + 1] = -2;
      }
      attr.needsUpdate = true;
    }

    if (fill01 < 0.01) {
      liquid.visible = false;
      side.visible = false;
    } else {
      liquid.visible = true;
      side.visible = true;
    }

    renderer.render(scene, camera);
  };

  raf = requestAnimationFrame(tick);

  return {
    setState: applyState,
    setActive: (v: boolean) => {
      active = v;
      if (v) lastFrame = 0;
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      liquidGeo.dispose();
      liquidMat.dispose();
      side.geometry.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    },
  };
}
