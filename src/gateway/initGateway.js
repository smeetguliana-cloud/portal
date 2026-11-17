/**
 * ============================================================================
 * VISIONEXA '26 — MULTIVERSE 404 (REALITY NOT FOUND)
 * 2.5D Parallax World Tree, Additive-Blended Spinning Vortex Portals,
 * Screen-Tear Dimensional Dive & "Return to Nexus" Navigation Loop
 * ============================================================================
 * Strict Scope Guardrail:
 * - All edits strictly scoped to `src/gateway/initGateway.js` without modifying `index.html`.
 * - Zero geometric 3D wireframes or line networks; built as a photorealistic
 *   2.5D Parallax environment with 7 glowing additive-blended vortex portals.
 *
 * Architecture Overview:
 * - Phase 1: 2.5D Parallax & Camera Setup
 *   * Dedicated THREE.Scene and PerspectiveCamera at z = 0.
 *   * Layer 1 (Nebula Background): '/assets/layer1_bg.jpg' at z = -60
 *   * Layer 2 (The World Tree):    '/assets/layer2_tree.png' at z = -30
 *   * Layer 3 (Foreground Roots):  '/assets/layer3_fg.png' at z = -10
 *   * Responsive frustum cover-scaling and GSAP camera X/Y parallax on pointer move.
 * - Phase 2: The 7 Universe Portals (Additive Blending)
 *   * 7 THREE.PlaneGeometry portal meshes placed at branch coordinates on the
 *     Tree plane (z = -29.9).
 *   * Uses THREE.MeshBasicMaterial with '/assets/portal_vortex.jpg' (resolved with .png)
 *     as `map`, `transparent: true`, `depthWrite: false`, `blending: THREE.AdditiveBlending`,
 *     and `material.color.set()` tinted to each universe's signature brand color.
 *   * Portals continuously rotate on their Z-axis (`mesh.rotation.z`).
 *   * On Raycaster hover: GSAP scales the portal up, accelerates its spin speed,
 *     and fades in a minimal HTML UI label (e.g., "SECTOR 01 // TECHVERSE") over the portal.
 * - Phase 3: The Dimensional Dive & Handoff
 *   * Clicking a portal triggers a GSAP timeline that flies the camera Z forward
 *     past the foreground roots directly into the clicked portal's X/Y coordinates,
 *     widens the camera FOV dramatically for warp speed, and drives a custom GLSL
 *     post-processing displacement/screen-tear shader via EffectComposer before
 *     hiding the gateway canvas and calling `window.VisionexaUniverse.enter(id)`.
 * - Phase 4: "Return to Gateway" Navigation Loop
 *   * Dynamically creates `<button id="return-to-nexus">RETURN TO NEXUS</button>`
 *     (positioned at top:20px; left:20px; z-index:9999; initially hidden).
 *   * Fades the button in when `window.VisionexaUniverse.enter(id)` is called.
 *   * On click, reverses the transition: shows the gateway canvas, triggers a
 *     quick screen tear, zooms the camera back out from the portal to z = 0,
 *     hides the button, and hides the panoramic city view.
 * ============================================================================
 */

import './gatewayUI.css';

/* -------------------------------------------------------------------------- */
/* 1. LIGHTWEIGHT GSAP-COMPATIBLE TIMELINE & TWEEN ENGINE                     */
/*    Uses window.gsap if available, or provides a built-in GSAP-compatible   */
/*    tween & timeline engine so animations run with zero external scripts.   */
/* -------------------------------------------------------------------------- */
const gsap = window.gsap || (() => {
  const activeTweens = new Set();

  const eases = {
    'power2.out': (t) => 1 - Math.pow(1 - t, 2),
    'power2.in': (t) => t * t,
    'power2.inOut': (t) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    'power3.in': (t) => t * t * t,
    'power3.out': (t) => 1 - Math.pow(1 - t, 3),
    'power3.inOut': (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    'expo.in': (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
    'expo.out': (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    'expo.inOut': (t) =>
      t === 0
        ? 0
        : t === 1
        ? 1
        : t < 0.5
        ? Math.pow(2, 20 * t - 10) / 2
        : (2 - Math.pow(2, -20 * t + 10)) / 2,
    linear: (t) => t,
  };

  function getEase(name) {
    return eases[name] || eases['power2.out'];
  }

  function createTween(target, vars, startTimeOffsetMs = 0) {
    const durationMs =
      (vars.duration !== undefined ? vars.duration : 0.8) * 1000;
    const delayMs =
      (vars.delay !== undefined ? vars.delay : 0) * 1000 + startTimeOffsetMs;
    const easeFn = getEase(vars.ease);
    const onUpdate = vars.onUpdate;
    const onComplete = vars.onComplete;

    const reservedKeys = new Set([
      'duration',
      'delay',
      'ease',
      'onUpdate',
      'onComplete',
      'overwrite',
    ]);

    const propKeys = Object.keys(vars).filter((k) => !reservedKeys.has(k));
    const startValues = {};
    let initialized = false;
    const createdAt = performance.now();

    const tween = {
      target,
      propKeys,
      step(now) {
        const elapsed = now - createdAt - delayMs;
        if (elapsed < 0) return false;

        if (!initialized) {
          initialized = true;
          for (const k of propKeys) {
            startValues[k] = Number(target[k]) || 0;
          }
        }

        const progress =
          durationMs <= 0 ? 1 : Math.min(1, elapsed / durationMs);
        const eased = easeFn(progress);

        for (const k of propKeys) {
          target[k] = startValues[k] + (vars[k] - startValues[k]) * eased;
        }

        if (typeof onUpdate === 'function') onUpdate();

        if (progress >= 1) {
          if (typeof onComplete === 'function') onComplete();
          return true;
        }
        return false;
      },
    };

    if (vars.overwrite) {
      for (const existing of activeTweens) {
        if (existing.target === target) {
          activeTweens.delete(existing);
        }
      }
    }

    activeTweens.add(tween);
    return tween;
  }

  function updateLoop(now) {
    for (const tween of activeTweens) {
      if (tween.step(now)) {
        activeTweens.delete(tween);
      }
    }
    requestAnimationFrame(updateLoop);
  }
  requestAnimationFrame(updateLoop);

  return {
    to(target, vars) {
      return createTween(target, vars, 0);
    },
    timeline(tlVars = {}) {
      let cursorMs = 0;
      const api = {
        to(target, vars, position = null) {
          const offsetMs =
            typeof position === 'number' ? position * 1000 : cursorMs;
          const durMs =
            (vars.duration !== undefined ? vars.duration : 0.8) * 1000;
          createTween(target, vars, offsetMs);
          cursorMs = Math.max(cursorMs, offsetMs + durMs);
          return api;
        },
        call(fn, params = [], position = null) {
          const callOffsetMs =
            typeof position === 'number' ? position * 1000 : cursorMs;
          setTimeout(() => {
            fn(...params);
          }, Math.max(0, callOffsetMs));
          return api;
        },
      };
      if (typeof tlVars.onComplete === 'function') {
        setTimeout(() => tlVars.onComplete(), cursorMs);
      }
      return api;
    },
  };
})();

/* -------------------------------------------------------------------------- */
/* 2. SELF-CONTAINED EFFECTCOMPOSER & POST-PROCESSING PASSES (THREE r128)     */
/* -------------------------------------------------------------------------- */
class RenderPass {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
  }
}

class ShaderPass {
  constructor(shader) {
    const THREE = window.THREE;
    this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      depthWrite: false,
      depthTest: false,
    });
    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadScene = new THREE.Scene();
    this.quadMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.material
    );
    this.quadScene.add(this.quadMesh);
  }

  render(renderer, writeBuffer, readBuffer, renderToScreen) {
    if (this.uniforms.tDiffuse) {
      this.uniforms.tDiffuse.value = readBuffer.texture;
    }
    if (renderToScreen) {
      renderer.setRenderTarget(null);
      renderer.render(this.quadScene, this.quadCamera);
    } else {
      renderer.setRenderTarget(writeBuffer);
      renderer.clear();
      renderer.render(this.quadScene, this.quadCamera);
    }
  }

  dispose() {
    this.quadMesh.geometry.dispose();
    this.material.dispose();
  }
}

class EffectComposer {
  constructor(renderer) {
    const THREE = window.THREE;
    this.renderer = renderer;
    const size = renderer.getSize(new THREE.Vector2());
    const pixelRatio = renderer.getPixelRatio();
    this.renderTarget1 = new THREE.WebGLRenderTarget(
      size.x * pixelRatio,
      size.y * pixelRatio,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      }
    );
    this.renderTarget2 = this.renderTarget1.clone();
    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;
    this.passes = [];
  }

  addPass(pass) {
    this.passes.push(pass);
  }

  setSize(width, height) {
    const pixelRatio = this.renderer.getPixelRatio();
    this.renderTarget1.setSize(width * pixelRatio, height * pixelRatio);
    this.renderTarget2.setSize(width * pixelRatio, height * pixelRatio);
  }

  swapBuffers() {
    const tmp = this.readBuffer;
    this.readBuffer = this.writeBuffer;
    this.writeBuffer = tmp;
  }

  render() {
    const lastIdx = this.passes.length - 1;
    for (let i = 0; i <= lastIdx; i++) {
      const pass = this.passes[i];
      const isLast = i === lastIdx;
      if (pass instanceof RenderPass) {
        this.renderer.setRenderTarget(isLast ? null : this.writeBuffer);
        this.renderer.clear();
        this.renderer.render(pass.scene, pass.camera);
        if (!isLast) this.swapBuffers();
      } else if (pass instanceof ShaderPass) {
        pass.render(this.renderer, this.writeBuffer, this.readBuffer, isLast);
        if (!isLast) this.swapBuffers();
      }
    }
  }

  dispose() {
    this.renderTarget1.dispose();
    this.renderTarget2.dispose();
    for (const pass of this.passes) {
      if (typeof pass.dispose === 'function') pass.dispose();
    }
  }
}

/* -------------------------------------------------------------------------- */
/* 3. SEVEN INTERACTIVE BRANCHES & DIMENSIONAL PORTALS (PHASE 4)              */
/*    Each destination maps to a major organic bough of the World Tree        */
/*    (rootUv -> midUv -> portalUv in Layer 2 UV space) and opens an          */
/*    elongated dimensional tear into its universe interior artwork.          */
/* -------------------------------------------------------------------------- */
const UNIVERSE_PORTALS = [
  {
    id: 'techverse',
    sector: 'SECTOR 01',
    title: 'TECHVERSE',
    branchName: 'UPPER-LEFT CROWN BOUGH',
    label: 'SECTOR 01 · TECHVERSE',
    color: '#42d9ff',
    secondaryColor: '#bae6fd',
    interiorBg: '/assets/techverse-bg.webp',
    nx: -0.25,
    ny: 0.21,
    rootUv: [0.455, 0.575],
    midUv: [0.382, 0.628],
    portalUv: [0.315, 0.648],
    tilt: 0.34,
    aspect: [0.76, 1.28],
    branchDir: [-0.86, 0.51],
    seed: 1.17,
  },
  {
    id: 'gameverse',
    sector: 'SECTOR 02',
    title: 'GAMEVERSE',
    branchName: 'MID-LEFT LATERAL BOUGH',
    label: 'SECTOR 02 · GAMEVERSE',
    color: '#a855f7',
    secondaryColor: '#d8b4fe',
    interiorBg: '/assets/gameverse-bg.webp',
    nx: -0.34,
    ny: 0.03,
    rootUv: [0.440, 0.525],
    midUv: [0.340, 0.542],
    portalUv: [0.248, 0.521],
    tilt: 0.46,
    aspect: [0.74, 1.32],
    branchDir: [-0.98, 0.18],
    seed: 2.43,
  },
  {
    id: 'vibeverse',
    sector: 'SECTOR 03',
    title: 'VIBEVERSE',
    branchName: 'LOWER-LEFT SHOULDER BOUGH',
    label: 'SECTOR 03 · VIBEVERSE',
    color: '#f472b6',
    secondaryColor: '#fbcfe8',
    interiorBg: '/assets/vibeverse-bg.webp',
    nx: -0.19,
    ny: -0.09,
    rootUv: [0.448, 0.465],
    midUv: [0.402, 0.455],
    portalUv: [0.359, 0.436],
    tilt: -0.30,
    aspect: [0.78, 1.25],
    branchDir: [-0.93, -0.36],
    seed: 3.71,
  },
  {
    id: 'aiverse',
    sector: 'SECTOR 04',
    title: 'AIVERSE',
    branchName: 'CENTRAL CROWN APEX',
    label: 'SECTOR 04 · AIVERSE',
    color: '#fbbf24',
    secondaryColor: '#fef3c7',
    interiorBg: '/assets/aiverse-bg.webp',
    nx: 0.0,
    ny: 0.29,
    rootUv: [0.498, 0.555],
    midUv: [0.500, 0.630],
    portalUv: [0.500, 0.705],
    tilt: 0.02,
    aspect: [0.74, 1.34],
    branchDir: [0.0, 1.0],
    seed: 4.89,
  },
  {
    id: 'cyberverse',
    sector: 'SECTOR 05',
    title: 'CYBERVERSE',
    branchName: 'UPPER-RIGHT CROWN BOUGH',
    label: 'SECTOR 05 · CYBERVERSE',
    color: '#2dd4bf',
    secondaryColor: '#0d9488',
    interiorBg: '/assets/cyberverse-bg.webp',
    nx: 0.25,
    ny: 0.21,
    rootUv: [0.545, 0.580],
    midUv: [0.618, 0.628],
    portalUv: [0.685, 0.648],
    tilt: -0.34,
    aspect: [0.76, 1.28],
    branchDir: [0.86, 0.51],
    seed: 5.63,
  },
  {
    id: 'humanverse',
    sector: 'SECTOR 06',
    title: 'HUMANVERSE',
    branchName: 'MID-RIGHT LATERAL BOUGH',
    label: 'SECTOR 06 · HUMANVERSE',
    color: '#34d399',
    secondaryColor: '#fcd34d',
    interiorBg: '/assets/humanverse-bg.webp',
    nx: 0.34,
    ny: 0.02,
    rootUv: [0.558, 0.542],
    midUv: [0.656, 0.548],
    portalUv: [0.752, 0.514],
    tilt: -0.44,
    aspect: [0.74, 1.32],
    branchDir: [0.98, 0.16],
    seed: 6.29,
  },
  {
    id: 'futureverse',
    sector: 'SECTOR 07',
    title: 'FUTUREVERSE',
    branchName: 'LOWER-RIGHT SHOULDER BOUGH',
    label: 'SECTOR 07 · FUTUREVERSE',
    color: '#e2e8f0',
    secondaryColor: '#bae6fd',
    interiorBg: '/assets/futureverse-bg.webp',
    nx: 0.20,
    ny: -0.10,
    rootUv: [0.552, 0.462],
    midUv: [0.602, 0.448],
    portalUv: [0.648, 0.429],
    tilt: 0.30,
    aspect: [0.78, 1.25],
    branchDir: [0.93, -0.36],
    seed: 7.41,
  },
];

/* -------------------------------------------------------------------------- */
/* 4. CUSTOM GLSL SHADERS FOR PARALLAX LAYERS & SCREEN-TEAR POST-PROCESSING   */
/* -------------------------------------------------------------------------- */

/**
 * SKY BACKDROP SHADER (Layer 1: cosmic_cloud_sky_16x9.jpg @ z = -60)
 * Renders the distant cosmic nebula clouds while seamlessly healing the tiny
 * bottom-right corner star watermark with adjacent nebula texels.
 */
const SKY_BACKDROP_SHADER = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    uniform float uHasTexture;
    varying vec2 vUv;

    void main() {
      if (uHasTexture < 0.5) {
        gl_FragColor = vec4(0.008, 0.016, 0.039, 1.0);
        return;
      }

      vec3 col = texture2D(uTexture, vUv).rgb;

      // Heal tiny bottom-right corner star watermark using surrounding cloud pixels
      float wmDist = length((vUv - vec2(0.966, 0.044)) * vec2(1.78, 1.0));
      float wmMask = 1.0 - smoothstep(0.016, 0.052, wmDist);
      if (wmMask > 0.001) {
        vec2 sampleUv = vec2(min(vUv.x, 0.922), max(vUv.y, 0.095));
        vec3 healCol = texture2D(uTexture, sampleUv).rgb * 0.92;
        col = mix(col, healCol, wmMask);
      }

      // Softly blend outer sky boundaries into deep cosmic void so steep camera look never shows a border
      float edgeFade =
        smoothstep(0.0, 0.08, vUv.x) *
        smoothstep(1.0, 0.92, vUv.x) *
        smoothstep(0.0, 0.09, vUv.y) *
        smoothstep(1.0, 0.91, vUv.y);
      col = mix(vec3(0.008, 0.018, 0.042), col, edgeFade);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

/**
 * WORLD TREE SHADER (Layer 2: cosmic_tree_main_layer_clean.png @ z = -30)
 * - Combines clean alpha `uBaseTexture` with pixel-aligned `uEmissiveMask`
 *   ('/assets/layer4_emissive.png') so energy rises organically from the roots,
 *   gathers in powerful slow central trunk pulses, splits asymmetrically along
 *   branches toward the outer tips, and softly illuminates adjacent bark veins.
 * - Preserves gentle green-spill cleanup and corner watermark suppression.
 */
const WORLD_TREE_SHADER = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uBaseTexture;
    uniform sampler2D uEmissiveMask;
    uniform float uHasBase;
    uniform float uHasMask;
    uniform float uTime;
    uniform float uDriftScale;
    uniform float uSpeed;
    uniform float uFrequency;
    uniform float uGlowIntensity;
    uniform float uTreePulse;

    // Phase 4: Localized branch hover energy activation & directional pulse
    uniform vec2 uActiveBranchRoot;
    uniform vec2 uActiveBranchMid;
    uniform vec2 uActiveBranchEnd;
    uniform vec3 uActiveBranchColor;
    uniform vec3 uActiveBranchSecondary;
    uniform float uActiveBranchHover;
    uniform float uActiveBranchTime;

    varying vec2 vUv;

    // Distance from point p to segment a->b in aspect-corrected tree UV space,
    // returning vec2(distance, clamped segment parameter t in [0..1]).
    vec2 sdSegmentProgress(vec2 p, vec2 a, vec2 b) {
      vec2 aspect = vec2(1.78, 1.0);
      vec2 pa = (p - a) * aspect;
      vec2 ba = (b - a) * aspect;
      float denom = max(0.00001, dot(ba, ba));
      float h = clamp(dot(pa, ba) / denom, 0.0, 1.0);
      return vec2(length(pa - ba * h), h);
    }

    // Evaluates distance and arc progress [0..1] along quadratic Bezier branch spine (root -> mid -> portal)
    vec2 evalBranchBezier(vec2 uv, vec2 p0, vec2 p1, vec2 p2) {
      vec2 best = vec2(10.0, 0.0);
      vec2 prev = p0;
      for (int i = 1; i <= 5; i++) {
        float t = float(i) * 0.2;
        float inv = 1.0 - t;
        vec2 cur = inv * inv * p0 + 2.0 * inv * t * p1 + t * t * p2;
        vec2 seg = sdSegmentProgress(uv, prev, cur);
        if (seg.x < best.x) {
          best = vec2(seg.x, (float(i - 1) + seg.y) * 0.2);
        }
        prev = cur;
      }
      return best;
    }

    // Subtle organic branch-tendril filament connecting each major bough tip into its reality tear
    float branchTerminalTendril(vec2 uv, vec2 bMid, vec2 bEnd, float seed) {
      vec2 seg = sdSegmentProgress(uv, bMid, bEnd);
      float d = seg.x;
      float s = seg.y;
      float wave = sin(s * 18.0 + seed * 3.7) * 0.0038 * (1.0 - s * 0.45);
      float w = mix(0.011, 0.0045, s);
      float core = smoothstep(w, 0.0, abs(d + wave));
      float braid = smoothstep(w * 1.45, 0.0, abs(d - wave * 0.85)) * 0.55;
      return (core + braid) * smoothstep(0.0, 0.18, s) * smoothstep(1.0, 0.78, s);
    }

    void main() {
      if (uHasBase < 0.5) discard;

      vec4 baseTex = texture2D(uBaseTexture, vUv);

      // Gentle despill for residual green fringe on fine outer twigs
      float maxRB = max(baseTex.r, baseTex.b);
      float greenExcess = max(0.0, baseTex.g - maxRB);
      vec3 treeColor = baseTex.rgb;
      treeColor.g = mix(baseTex.g, maxRB * 0.93, smoothstep(0.02, 0.15, greenExcess));

      // Suppress bottom-right corner star watermark in both base and emissive mask
      float wmDist = length((vUv - vec2(0.966, 0.044)) * vec2(1.78, 1.0));
      float wmCut = smoothstep(0.018, 0.052, wmDist);

      // Sample pixel-aligned layer4_emissive.png early so fine luminous outer branch twigs
      // that extend toward the 7 portals are preserved rather than clipped by baseTex.a
      float maskVal = (uHasMask > 0.5) ? (texture2D(uEmissiveMask, vUv).r * wmCut) : 0.0;

      // Organic terminal branch tendrils bridging the 7 major boughs directly into their portals
      float tendrilMask = 0.0;
      if (vUv.y > 0.36 && vUv.y < 0.76) {
        tendrilMask = max(tendrilMask, branchTerminalTendril(vUv, vec2(0.382, 0.628), vec2(0.315, 0.648), 1.17));
        tendrilMask = max(tendrilMask, branchTerminalTendril(vUv, vec2(0.340, 0.542), vec2(0.248, 0.521), 2.43));
        tendrilMask = max(tendrilMask, branchTerminalTendril(vUv, vec2(0.402, 0.455), vec2(0.359, 0.436), 3.71));
        tendrilMask = max(tendrilMask, branchTerminalTendril(vUv, vec2(0.500, 0.630), vec2(0.500, 0.705), 4.89));
        tendrilMask = max(tendrilMask, branchTerminalTendril(vUv, vec2(0.618, 0.628), vec2(0.685, 0.648), 5.63));
        tendrilMask = max(tendrilMask, branchTerminalTendril(vUv, vec2(0.656, 0.548), vec2(0.752, 0.514), 6.29));
        tendrilMask = max(tendrilMask, branchTerminalTendril(vUv, vec2(0.602, 0.448), vec2(0.648, 0.429), 7.41));
      }

      float effectiveMask = max(maskVal, tendrilMask * 0.76);
      float veinBridgeAlpha = smoothstep(0.04, 0.34, effectiveMask) * 0.90;
      float alpha = max(baseTex.a * wmCut, veinBridgeAlpha);
      if (alpha < 0.018) discard;

      // Provide subtle dark organic bark backing on fine outer luminous twigs where base alpha was thin
      vec3 barkSilhouette = vec3(0.045, 0.036, 0.028);
      treeColor = mix(barkSilhouette, treeColor, smoothstep(0.02, 0.38, baseTex.a));

      // Living root-to-trunk-to-branch energy flow along registered veins
      if (uHasMask > 0.5) {
        // Tight 4-tap neighbor sampling for subtle soft vein halo on bark
        vec2 haloStep = vec2(0.0017, 0.0030);
        float haloAvg = 0.25 * (
          texture2D(uEmissiveMask, vUv + vec2(haloStep.x, 0.0)).r +
          texture2D(uEmissiveMask, vUv - vec2(haloStep.x, 0.0)).r +
          texture2D(uEmissiveMask, vUv + vec2(0.0, haloStep.y)).r +
          texture2D(uEmissiveMask, vUv - vec2(0.0, haloStep.y)).r
        ) * wmCut;
        float haloMask = max(0.0, haloAvg - maskVal * 0.45) + tendrilMask * 0.28;

        // Evaluate proximity & outward progress [0..1] along the currently hovered branch
        float activeBranchMask = 0.0;
        float activeBranchProgress = 0.0;
        float activeBranchFilament = 0.0;
        if (uActiveBranchHover > 0.002) {
          vec2 bInfo = evalBranchBezier(vUv, uActiveBranchRoot, uActiveBranchMid, uActiveBranchEnd);
          float bDist = bInfo.x;
          activeBranchProgress = bInfo.y;
          float corridorWidth = mix(0.070, 0.046, activeBranchProgress);
          activeBranchMask = smoothstep(corridorWidth, corridorWidth * 0.16, bDist) *
                             smoothstep(-0.02, 0.10, activeBranchProgress);
          float filWave = sin(activeBranchProgress * 22.0 - uTime * 3.4) * 0.0032;
          activeBranchFilament = smoothstep(0.010, 0.0, abs(bDist + filWave)) *
                                 smoothstep(0.15, 0.65, activeBranchProgress);
        }

        if (effectiveMask > 0.004 || haloMask > 0.004 || (activeBranchMask * uActiveBranchHover) > 0.01) {
          float tFlow = uTime * uDriftScale;

          // Anatomical flow coordinate: inward/upward from roots -> trunk -> radial branches
          float rootConverge = 0.36 - (abs(vUv.x - 0.50) * 1.15 + max(0.0, 0.36 - vUv.y) * 1.45);
          vec2 branchDelta = vUv - vec2(0.50, 0.44);
          float branchRadial = 0.34 + length(branchDelta * vec2(1.16, 1.05));
          float upperBlend = smoothstep(0.30, 0.54, vUv.y);
          float flowCoord = mix(rootConverge, branchRadial, upperBlend);

          // Azimuthal branch offset (zero inside central trunk, staggered across boughs)
          float branchAngle = atan(branchDelta.x, branchDelta.y + 0.0001);
          float outerBranchWeight = smoothstep(0.055, 0.24, length(branchDelta * vec2(1.0, 0.88)));
          float branchPhase = outerBranchWeight * (
            0.52 * sin(branchAngle * 2.6 + 0.7) +
            0.34 * cos(branchAngle * 5.0 - 1.15) +
            0.20 * sin(vUv.x * 8.5 - vUv.y * 4.2)
          );

          // Root channel offset so root currents gather asynchronously upward
          float rootWeight = 1.0 - smoothstep(0.24, 0.40, vUv.y);
          float rootPhase = rootWeight * (
            0.38 * sin((vUv.x - 0.50) * 14.0 + 0.4) +
            0.18 * cos(vUv.y * 12.0)
          );
          float asymPhase = branchPhase + rootPhase;

          // 1. Continuous directional sap-flow waves climbing from roots toward branch tips
          float wave1 = 0.5 + 0.5 * sin(tFlow * (uSpeed * 0.38) - flowCoord * (uFrequency * 0.72) + asymPhase * 3.1);
          float ribbon1 = pow(max(0.0001, wave1), 2.6);

          // 2. Staggered traveling energy surge packets moving asymmetrically outward
          float packetCycle = fract(tFlow * 0.21 - flowCoord * 0.76 + asymPhase * 0.52);
          float packet = smoothstep(0.14, 0.42, packetCycle) * smoothstep(0.82, 0.43, packetCycle);
          packet = pow(max(0.0001, packet), 1.6);

          // 3. Slow majestic central trunk heartbeat pulse (~9.5s cycle) + delayed crown wave
          float trunkDx = (vUv.x - 0.50) / 0.115;
          float trunkColumn = exp(-(trunkDx * trunkDx)) *
                              smoothstep(0.14, 0.27, vUv.y) *
                              smoothstep(0.76, 0.50, vUv.y);
          float pulseCycle = fract(tFlow * 0.105);
          float pulseFront = 0.14 + vUv.y * 0.58;
          float trunkDt = (pulseCycle - pulseFront) / 0.105;
          float trunkWave = exp(-(trunkDt * trunkDt));
          float crownDt = (pulseCycle - (0.34 + flowCoord * 0.46 + branchPhase * 0.08)) / 0.11;
          float crownWave = exp(-(crownDt * crownDt)) *
                            smoothstep(0.36, 0.58, vUv.y);

          // Slow sectoral breathing so branches do not illuminate uniformly together
          float sectorActivity = mix(
            1.0,
            0.50 + 0.50 * sin(branchAngle * 3.0 - tFlow * 0.24 + 1.2),
            outerBranchWeight
          );

          float veinEnergy =
            0.16 +
            (0.46 * ribbon1 + 0.58 * packet) * sectorActivity +
            0.62 * trunkWave * trunkColumn +
            0.40 * crownWave * sectorActivity +
            0.08 * uTreePulse * trunkColumn;

          float tipBoost = 1.0 + 0.20 * smoothstep(0.30, 0.72, branchRadial);
          veinEnergy *= tipBoost;

          vec3 cyanAccent = vec3(0.24, 0.84, 0.98);
          vec3 warmGold = vec3(1.00, 0.82, 0.42);
          vec3 ivoryCore = vec3(1.00, 0.96, 0.84);

          float goldBias = clamp(
            0.55 +
            0.24 * sin(flowCoord * 4.5 - tFlow * 0.45 + asymPhase * 2.0) +
            0.35 * (trunkWave * trunkColumn + packet * 0.5),
            0.0,
            1.0
          );
          vec3 baseVeinCol = mix(cyanAccent, warmGold, goldBias);
          vec3 coreCol = mix(baseVeinCol, ivoryCore, smoothstep(0.75, 1.45, veinEnergy) * 0.72);

          // Phase 4 Part B: Localized hovered-branch vein intensification & outward traveling pulse
          if (activeBranchMask > 0.001 && uActiveBranchHover > 0.002) {
            float hStrength = activeBranchMask * uActiveBranchHover;

            // Outward traveling surge wave along the hovered branch (from trunk s=0 -> portal tip s=1)
            float pulsePhase = fract(uActiveBranchTime * 0.78 - activeBranchProgress * 0.92);
            float travelPulse = smoothstep(0.06, 0.36, pulsePhase) * smoothstep(0.84, 0.38, pulsePhase);
            travelPulse = pow(max(0.0001, travelPulse), 1.45);

            // Secondary harmonic carrier wave flowing toward the branch endpoint
            float carrierWave = pow(
              max(0.0001, 0.5 + 0.5 * sin(uActiveBranchTime * 5.2 - activeBranchProgress * 9.5)),
              2.2
            );
            float endpointGather = smoothstep(0.55, 1.0, activeBranchProgress) * 0.45;

            float branchSurge =
              hStrength * (0.52 + 1.18 * travelPulse + 0.54 * carrierWave + endpointGather);

            veinEnergy += branchSurge;
            effectiveMask = max(effectiveMask, activeBranchFilament * hStrength * 0.88);
            haloMask += (effectiveMask * 0.36 + activeBranchFilament * 0.28) * hStrength;

            vec3 uniCol = mix(
              uActiveBranchColor,
              uActiveBranchSecondary,
              0.32 + 0.48 * travelPulse + 0.20 * endpointGather
            );
            float colorBlend = clamp(hStrength * (0.68 + 0.32 * travelPulse), 0.0, 0.92);
            coreCol = mix(coreCol, mix(uniCol, ivoryCore, 0.32 * travelPulse), colorBlend);
          }

          vec3 coreGlow = coreCol * effectiveMask * veinEnergy * 0.86;
          vec3 haloCol = mix(cyanAccent * 0.85, warmGold, goldBias * 0.85);
          if (activeBranchMask > 0.001 && uActiveBranchHover > 0.002) {
            haloCol = mix(
              haloCol,
              uActiveBranchColor,
              clamp(activeBranchMask * uActiveBranchHover * 0.78, 0.0, 0.88)
            );
          }
          vec3 haloGlow = haloCol * haloMask * smoothstep(0.24, 1.15, veinEnergy) * 0.42;

          treeColor += (coreGlow + haloGlow) * uGlowIntensity;

          // Soft filmic shoulder to prevent flat white highlight clipping
          vec3 excess = max(vec3(0.0), treeColor - vec3(0.88));
          treeColor = min(treeColor, vec3(0.88)) + excess / (1.0 + excess * 1.15);
        }
      }

      gl_FragColor = vec4(treeColor, alpha);
    }
  `,
};

/**
 * UPPER CANOPY EXTENSION SHADER (Layer 2B: upper_canopy_and_branches.png @ z = -32.6)
 * Extends the World Tree crown upward behind Layer 2 with soft multi-edge
 * feathering and subtle delayed energy surges reaching high canopy tips.
 */
const CANOPY_EXTENSION_SHADER = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    uniform float uHasTexture;
    uniform float uTime;
    uniform float uDriftScale;
    uniform float uTreePulse;
    varying vec2 vUv;

    void main() {
      if (uHasTexture < 0.5) discard;

      vec4 tex = texture2D(uTexture, vUv);
      if (tex.a < 0.02) discard;

      // Gentle despill on fine upper canopy twigs
      float maxRB = max(tex.r, tex.b);
      float greenExcess = max(0.0, tex.g - maxRB);
      vec3 col = tex.rgb;
      col.g = mix(tex.g, maxRB * 0.93, smoothstep(0.02, 0.16, greenExcess));

      // Feather bottom overlap (avoid double trunk behind Layer 2), outer sides, and top sky fade
      float bottomFeather = smoothstep(0.16, 0.54, vUv.y);
      float sideFeather = smoothstep(0.0, 0.13, vUv.x) * smoothstep(1.0, 0.87, vUv.x);
      float topFeather = smoothstep(1.0, 0.80, vUv.y);
      float seamMask = bottomFeather * sideFeather * topFeather;

      // Subtle living energy arriving along existing warm canopy vein highlights
      float warmSignal = max(col.r, col.g * 0.92) - col.b * 0.48;
      float luma = dot(col, vec3(0.34, 0.50, 0.16));
      float canopyVein = smoothstep(0.16, 0.48, warmSignal) * smoothstep(0.20, 0.55, luma);
      if (canopyVein > 0.01) {
        float tFlow = uTime * uDriftScale;
        vec2 cDelta = vUv - vec2(0.50, 0.12);
        float cDist = length(cDelta * vec2(1.15, 1.0));
        float cAngle = atan(cDelta.x, cDelta.y + 0.0001);
        float cPhase = 0.50 * sin(cAngle * 2.8 - 0.5) + 0.25 * cos(vUv.x * 9.0);
        float arrivalWave = pow(max(0.0001, 0.5 + 0.5 * sin(tFlow * 0.92 - cDist * 6.4 + cPhase * 2.6)), 2.8);
        float surgeDt = (fract(tFlow * 0.105) - (0.54 + cDist * 0.34 + cPhase * 0.06)) / 0.12;
        float surgeArrival = exp(-(surgeDt * surgeDt));
        vec3 canopyGlow = mix(vec3(1.0, 0.82, 0.42), vec3(0.45, 0.90, 1.0), 0.16 + 0.16 * cos(cDist * 5.0 - tFlow * 0.6));
        col += canopyGlow * canopyVein * (0.14 + 0.40 * arrivalWave + 0.32 * surgeArrival + 0.12 * uTreePulse) * topFeather;
      }

      // Subtle atmospheric depth tint so the upper extension harmonizes with the night sky
      col = mix(col, vec3(0.08, 0.15, 0.25), (1.0 - topFeather) * 0.35);

      float alpha = tex.a * seamMask * 0.94;
      if (alpha < 0.015) discard;

      gl_FragColor = vec4(col, alpha);
    }
  `,
};

/**
 * LOWER ROOT EXTENSION SHADER (Layer 2C: roots_and_ground_plate.png @ z = -24.5)
 * Extends the root floor downward below Layer 2 while subtly illuminating existing
 * root energy crevices traveling inward and upward into the central trunk.
 */
const LOWER_ROOTS_SHADER = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    uniform float uHasTexture;
    uniform float uTime;
    uniform float uDriftScale;
    uniform float uTreePulse;
    varying vec2 vUv;

    void main() {
      if (uHasTexture < 0.5) discard;

      vec4 tex = texture2D(uTexture, vUv);
      if (tex.a < 0.02) discard;

      // Despill faint green tint along upper root shoulders
      float maxRB = max(tex.r, tex.b);
      float greenExcess = max(0.0, tex.g - maxRB);
      vec3 col = tex.rgb;
      col.g = mix(tex.g, maxRB * 0.91, smoothstep(0.018, 0.14, greenExcess));

      // Carve down upper-center trunk shoulder so Layer 2's trunk remains single and crisp
      float centerWeight = 1.0 - smoothstep(0.14, 0.36, abs(vUv.x - 0.5));
      float topCutoff = mix(0.86, 0.50, centerWeight);
      float topFeather = 1.0 - smoothstep(topCutoff - 0.24, topCutoff, vUv.y);

      // Feather left/right bounds and melt bottom into deep cosmic mist
      float sideFeather = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
      float bottomFeather = smoothstep(0.0, 0.24, vUv.y);

      // Suppress bottom-right corner watermark
      float wmDist = length((vUv - vec2(0.966, 0.085)) * vec2(3.44, 1.0));
      float wmCut = smoothstep(0.03, 0.09, wmDist);

      // Subtle traveling root energy along existing luminous root fissures toward trunk base
      float warmSignal = max(col.r, col.g * 0.94) - col.b * 0.58;
      float luma = dot(col, vec3(0.32, 0.52, 0.16));
      float fissureMask = smoothstep(0.14, 0.44, warmSignal) * smoothstep(0.18, 0.50, luma);
      if (fissureMask > 0.01) {
        float tFlow = uTime * uDriftScale;
        float rootDist = length((vUv - vec2(0.50, 0.76)) * vec2(1.0, 1.38));
        float rootAngle = atan(vUv.x - 0.50, 0.80 - vUv.y + 0.0001);
        float rootAsym = 0.45 * sin(rootAngle * 3.4 + 0.5) + 0.25 * cos(vUv.x * 11.0);
        float gatherWave = pow(max(0.0001, 0.5 + 0.5 * sin(tFlow * 0.95 + rootDist * 7.5 + rootAsym)), 2.8);
        float gatherPhase = fract(tFlow * 0.105 + rootDist * 0.35);
        float rootSurge = smoothstep(0.12, 0.38, gatherPhase) * smoothstep(0.82, 0.40, gatherPhase);
        vec3 rootGlowCol = mix(
          vec3(1.0, 0.80, 0.38),
          vec3(0.34, 0.86, 1.0),
          0.16 + 0.16 * sin(rootDist * 6.0 - tFlow)
        );
        float boost = 0.14 + 0.46 * gatherWave + 0.28 * rootSurge + 0.14 * uTreePulse;
        col += rootGlowCol * fissureMask * boost * bottomFeather;
      }

      col = mix(vec3(0.02, 0.045, 0.095), col * 0.92, bottomFeather);

      float alpha = tex.a * topFeather * sideFeather * bottomFeather * wmCut;
      if (alpha < 0.015) discard;

      gl_FragColor = vec4(col, alpha);
    }
  `,
};

/**
 * FOREGROUND ROOTS SHADER (Layer 3: cosmic_roots_foreground_clean.png @ z = -10)
 * Keeps only the outer left/right framing cave roots and extreme outer-bottom
 * root silhouettes at z = -10, carving a wide central opening so Layer 2's
 * World Tree trunk and branches render with zero duplication or ghosting.
 */
const FOREGROUND_ROOTS_SHADER = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    uniform float uHasTexture;
    varying vec2 vUv;

    void main() {
      if (uHasTexture < 0.5) discard;
      vec4 tex = texture2D(uTexture, vUv);

      // Clean any trace green fringe on outer bark edges
      float maxRB = max(tex.r, tex.b);
      float greenExcess = max(0.0, tex.g - maxRB);
      vec3 col = tex.rgb;
      col.g = mix(tex.g, maxRB * 0.90, smoothstep(0.018, 0.14, greenExcess));

      // Wide central cutout removes the duplicate inner trunk & branches completely,
      // retaining only the dramatic outer framing root arches and bottom-corner anchors
      vec2 centerEllip = (vUv - vec2(0.5, 0.50)) / vec2(0.39, 0.56);
      float outerArchMask = smoothstep(0.76, 1.04, length(centerEllip));
      float cornerRootsMask =
        (1.0 - smoothstep(0.04, 0.13, vUv.y)) *
        smoothstep(0.10, 0.28, abs(vUv.x - 0.5));
      float fgMask = max(outerArchMask, cornerRootsMask);

      // Smoothly feather outer top/bottom/side boundaries so strong foreground parallax
      // never reveals a sharp rectangular image edge while looking up or down
      float boundaryFeather =
        smoothstep(0.0, 0.12, vUv.y) *
        smoothstep(1.0, 0.78, vUv.y) *
        smoothstep(0.0, 0.06, vUv.x) *
        smoothstep(1.0, 0.94, vUv.x);

      // Suppress bottom-right corner star watermark
      float wmDist = length((vUv - vec2(0.966, 0.044)) * vec2(1.78, 1.0));
      float wmCut = smoothstep(0.018, 0.052, wmDist);

      float alpha = tex.a * fgMask * boundaryFeather * wmCut;
      if (alpha < 0.015) discard;

      gl_FragColor = vec4(col * 0.88, alpha);
    }
  `,
};

/**
 * DISTANT VOLUMETRIC CLOUDS SHADER (Layer 1B @ z = -46)
 * Lightweight procedural FBM cosmic cloud wisps moving smoothly behind the
 * upper canopy and lower roots with subtle light response to trunk energy surges.
 */
const DISTANT_CLOUDS_SHADER = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uDriftScale;
    uniform float uTreePulse;
    varying vec2 vUv;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise2(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm3(vec2 p) {
      float v = 0.0;
      float amp = 0.52;
      for (int i = 0; i < 3; i++) {
        v += amp * noise2(p);
        p = p * 2.05 + vec2(13.7, 7.3);
        amp *= 0.5;
      }
      return v;
    }

    void main() {
      float t = uTime * 0.025 * uDriftScale;
      vec2 uv = vUv * vec2(3.6, 2.4);
      float n1 = fbm3(uv + vec2(t, -t * 0.4));
      float n2 = fbm3(uv * 1.6 - vec2(t * 0.7, t * 0.25) + n1 * 0.45);
      float cloud = smoothstep(0.40, 0.84, n1 * 0.55 + n2 * 0.55);

      float edgeMask =
        smoothstep(0.0, 0.14, vUv.x) *
        smoothstep(1.0, 0.86, vUv.x) *
        smoothstep(0.0, 0.14, vUv.y) *
        smoothstep(1.0, 0.86, vUv.y);

      vec3 deepCyan = vec3(0.05, 0.16, 0.28);
      vec3 warmGold = vec3(0.26, 0.20, 0.12);
      vec3 col = mix(deepCyan, warmGold, smoothstep(0.45, 0.85, n2) * 0.42);

      // Subtle atmospheric scatter near trunk & canopy in response to central pulses
      float trunkDist = length((vUv - vec2(0.50, 0.52)) * vec2(1.45, 1.10)) / 0.34;
      float trunkProx = exp(-(trunkDist * trunkDist));
      vec3 pulseScatter = mix(vec3(0.07, 0.18, 0.26), vec3(0.32, 0.24, 0.11), smoothstep(0.35, 0.85, n2));
      col += pulseScatter * trunkProx * uTreePulse * 0.48;

      float alpha = cloud * edgeMask * (0.23 + 0.055 * uTreePulse * trunkProx);
      if (alpha < 0.008) discard;
      gl_FragColor = vec4(col, alpha);
    }
  `,
};

/**
 * ABYSSAL CLOUD & VOID SHADER (Layer 2D @ z = -23.5)
 * Fills the lower expanse beneath the spreading roots with layered atmospheric
 * clouds fading into a deep cosmic abyss and gently catching lower root energy.
 */
const ABYSSAL_MIST_SHADER = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uDriftScale;
    uniform float uTreePulse;
    varying vec2 vUv;

    float hash21(vec2 p) {
      p = fract(p * vec2(231.14, 157.89));
      p += dot(p, p + 31.7);
      return fract(p.x * p.y);
    }

    float noise2(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
        mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    void main() {
      float t = uTime * 0.032 * uDriftScale;
      float n = noise2(vUv * vec2(4.2, 2.2) + vec2(t, -t * 0.5)) * 0.65 +
                noise2(vUv * vec2(8.5, 4.4) - vec2(t * 0.8, 0.0)) * 0.35;

      // Clear top edge, misty cloud belt in upper-mid, deep cosmic abyss below
      float topFade = smoothstep(1.0, 0.55, vUv.y);
      float abyssDepth = smoothstep(0.68, 0.08, vUv.y);
      float sideFade = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);

      vec3 mistCol = mix(vec3(0.03, 0.08, 0.16), vec3(0.005, 0.012, 0.028), abyssDepth);
      mistCol += vec3(0.06, 0.14, 0.22) * smoothstep(0.45, 0.85, n) * (1.0 - abyssDepth * 0.65);

      // Subtle warm golden-cyan bounce along upper root cloud belt
      float rootDx = (vUv.x - 0.50) / 0.22;
      float rootCoreProx = exp(-(rootDx * rootDx)) * smoothstep(0.28, 0.88, vUv.y);
      mistCol += vec3(0.14, 0.11, 0.06) * rootCoreProx * (0.28 + 0.72 * uTreePulse) * smoothstep(0.38, 0.88, n);

      float alpha = topFade * sideFade * mix(0.28, 0.88, abyssDepth) * (0.65 + 0.35 * n);
      if (alpha < 0.01) discard;
      gl_FragColor = vec4(mistCol, alpha);
    }
  `,
};

/**
 * FOREGROUND MIST SHADER (Layer 3B @ z = -8.2)
 * Soft drifting peripheral cosmic vapor near the camera plane for noticeable
 * foreground parallax and gentle rim light response while keeping the trunk clear.
 */
const FOREGROUND_MIST_SHADER = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uDriftScale;
    uniform float uTreePulse;
    varying vec2 vUv;

    float hash21(vec2 p) {
      p = fract(p * vec2(179.31, 311.73));
      p += dot(p, p + 19.19);
      return fract(p.x * p.y);
    }

    float noise2(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
        mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    void main() {
      float t = uTime * 0.045 * uDriftScale;
      float wisp = noise2(vUv * vec2(3.4, 2.2) + vec2(-t, t * 0.35)) * 0.6 +
                   noise2(vUv * vec2(6.8, 4.1) + vec2(t * 0.6, -t * 0.2)) * 0.4;
      wisp = smoothstep(0.36, 0.86, wisp);

      // Keep center trunk/branches crystal clear; confine foreground mist to outer/lower edges
      vec2 centerOffset = (vUv - vec2(0.5, 0.54)) / vec2(0.42, 0.46);
      float outerRing = smoothstep(0.68, 1.25, length(centerOffset));
      float lowerBias = 1.0 - smoothstep(0.05, 0.48, vUv.y);
      float mask = max(outerRing * 0.85, lowerBias * 0.9);

      float edgeFade =
        smoothstep(0.0, 0.10, vUv.x) *
        smoothstep(1.0, 0.90, vUv.x) *
        smoothstep(0.0, 0.10, vUv.y) *
        smoothstep(1.0, 0.85, vUv.y);

      vec3 col = mix(vec3(0.06, 0.18, 0.28), vec3(0.24, 0.20, 0.14), smoothstep(0.5, 0.9, wisp) * 0.35);
      col += vec3(0.11, 0.09, 0.05) * uTreePulse * smoothstep(0.45, 0.90, wisp);

      float alpha = wisp * mask * edgeFade * (0.17 + 0.03 * uTreePulse);
      if (alpha < 0.008) discard;
      gl_FragColor = vec4(col, alpha);
    }
  `,
};

/**
 * COSMIC SPORE & EMBER PARTICLES SHADER (THREE.Points across z = -26.5 .. -6.2)
 * Delicate golden-white and subtle cyan motes concentrated along root, trunk, and
 * branch channels with GPU-driven upward & outward organic drift.
 */
const COSMIC_PARTICLES_SHADER = {
  vertexShader: `
    attribute float aSize;
    attribute float aSeed;
    attribute float aColorMix;
    attribute float aChannel;

    uniform float uTime;
    uniform float uDriftScale;
    uniform float uPixelRatio;
    uniform float uTreePulse;
    uniform vec3 uActivePortalPos;
    uniform vec3 uActivePortalColor;
    uniform float uActiveBranchHover;

    varying float vAlpha;
    varying float vColorMix;
    varying float vPortalBoost;
    varying vec3 vPortalColor;

    void main() {
      vec3 pos = position;
      float t = uTime * uDriftScale;

      // Gentle upward energy drift; channel motes softly fan outward above the crown
      float travelSpan = mix(36.0, 28.0, aChannel);
      float speed = mix(0.14, 0.24, aChannel) + fract(aSeed * 7.13) * 0.20;
      float cycle = fract((pos.y + travelSpan * 0.5 + t * speed) / travelSpan);
      pos.y = cycle * travelSpan - travelSpan * 0.5;

      float spreadMask = smoothstep(-2.0, 14.0, pos.y) * aChannel;
      float radialSign = pos.x >= 0.0 ? 1.0 : -1.0;
      pos.x += radialSign * spreadMask * cycle * 2.2 +
               sin(t * 0.34 + aSeed * 19.3) * (0.40 + 0.26 * (1.0 - aChannel));
      pos.z += cos(t * 0.28 + aSeed * 11.7) * 0.30;

      // Restrained local particle response near hovered branch/portal
      float portalProx = 0.0;
      if (uActiveBranchHover > 0.01) {
        vec2 dPortal = pos.xy - uActivePortalPos.xy;
        float distP = length(dPortal);
        portalProx = smoothstep(8.2, 1.2, distP) * uActiveBranchHover;
        float swirlAngle = t * 1.35 + aSeed * 12.0;
        pos.x += cos(swirlAngle) * 0.26 * portalProx;
        pos.y += (0.28 + 0.20 * sin(swirlAngle)) * portalProx;
      }

      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPos;

      float distScale = clamp(22.0 / max(1.0, -mvPos.z), 0.42, 2.3);
      gl_PointSize = aSize * (1.0 + portalProx * 0.34) * distScale * uPixelRatio;

      float twinkle = 0.52 + 0.48 * sin(t * (0.95 + fract(aSeed * 3.7) * 1.1) + aSeed * 31.0);
      float edgeYFade = smoothstep(travelSpan * 0.5, travelSpan * 0.5 - 4.5, abs(pos.y));
      float pulseLift = 1.0 + aChannel * uTreePulse * 0.32 + portalProx * 0.42;
      vAlpha = twinkle * edgeYFade * (0.34 + 0.34 * fract(aSeed * 5.1)) * pulseLift;
      vColorMix = aColorMix;
      vPortalBoost = portalProx;
      vPortalColor = uActivePortalColor;
    }
  `,
  fragmentShader: `
    varying float vAlpha;
    varying float vColorMix;
    varying float vPortalBoost;
    varying vec3 vPortalColor;

    void main() {
      vec2 d = gl_PointCoord - vec2(0.5);
      float r = length(d) * 2.0;
      if (r > 1.0) discard;

      float core = pow(max(0.0001, 1.0 - r), 4.2) * 0.75;
      float aura = pow(max(0.0001, 1.0 - r), 2.4) * 0.45;
      float glow = core + aura;

      vec3 cyan = vec3(0.32, 0.86, 1.0);
      vec3 gold = vec3(1.0, 0.84, 0.44);
      vec3 ivory = vec3(1.0, 0.96, 0.85);
      vec3 col = vColorMix > 0.5
        ? mix(gold, ivory, (vColorMix - 0.5) * 1.65)
        : mix(cyan, gold, vColorMix * 1.4);
      col = mix(col, mix(vPortalColor, ivory, 0.35), clamp(vPortalBoost * 0.78, 0.0, 0.85));

      gl_FragColor = vec4(col, min(0.88, glow * vAlpha));
    }
  `,
};

/**
 * PHASE 4 SHADER: Organic Dimensional Reality-Tear Portal Shader
 * Renders each universe destination as an elongated, organic reality fissure
 * growing out of its World Tree branch, surrounded by flowing energy strands
 * and opening into a deep, parallax-shifted universe interior window.
 */
const DIMENSIONAL_PORTAL_SHADER = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uInteriorTex;
    uniform sampler2D uFilamentTex;
    uniform sampler2D uStreamTex;
    uniform float uHasInterior;
    uniform float uHasFilament;
    uniform float uHasStream;
    uniform float uTime;
    uniform float uDriftScale;
    uniform float uHover;
    uniform float uDiveBoost;
    uniform float uSeed;
    uniform float uTreePulse;
    uniform vec3 uPrimaryColor;
    uniform vec3 uSecondaryColor;
    uniform vec2 uCameraOffset;
    uniform vec2 uBranchDir;

    varying vec2 vUv;

    float hash21(vec2 p) {
      p = fract(p * vec2(127.1, 311.7));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }

    float noise2(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
        mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    float fbm3(vec2 p) {
      float v = 0.0;
      float a = 0.52;
      for (int i = 0; i < 3; i++) {
        v += a * noise2(p);
        p = p * 2.08 + vec2(11.3, 7.9);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      float t = uTime * uDriftScale;
      vec2 p = (vUv - 0.5) * 2.0;

      // Subtle organic spine curvature so the tear is never a rigid geometric oval
      float spineBend = 0.08 * sin(p.y * 2.5 + uSeed * 1.9 + t * 0.55) +
                        0.04 * cos(p.y * 4.4 - uSeed);
      vec2 q = p;
      q.x -= spineBend * (1.0 - 0.25 * abs(p.y));

      // Tapered organic reality-fissure proportions: pinched at top & root base, wider across heart
      float verticalPinch = 1.0 + 0.52 * pow(abs(q.y), 1.55);
      float asymShoulder = 1.0 + 0.10 * sin(q.y * 3.1 + uSeed * 2.1);
      vec2 tearSpace = vec2(q.x * 1.48 * verticalPinch * asymShoulder, q.y * 0.96);

      float r = length(tearSpace);
      float theta = atan(tearSpace.y, tearSpace.x + 0.0001);

      // Multi-octave organic FBM distortion along the tear perimeter
      vec2 noiseCoord = tearSpace * 2.25 + vec2(cos(uSeed) * 3.1, sin(uSeed) * 3.1);
      float n1 = fbm3(noiseCoord + vec2(t * 0.28, -t * 0.36));
      float n2 = fbm3(noiseCoord * 1.85 - vec2(t * 0.42, t * 0.24) + n1 * 0.55);
      float angularRipples =
        0.048 * sin(theta * 3.0 + uSeed * 2.3 + t * 0.9) +
        0.032 * cos(theta * 5.0 - t * 1.25 + n1 * 3.2) +
        0.022 * sin(theta * 8.0 + t * 1.6);

      float hoverOpen = uHover * 0.085 + uDiveBoost * 0.22;
      float rEff = r - (n1 - 0.5) * (0.24 + 0.07 * uHover) - (n2 - 0.5) * 0.14 - angularRipples - hoverOpen;

      // Branch-connection root tendrils along the lower stem (q.y < 0 points back into the branch)
      float stemAxis = clamp(-q.y, 0.0, 1.0);
      float stemWave1 = sin(stemAxis * 12.0 - t * 2.4 + uSeed) * 0.065 * stemAxis;
      float stemWave2 = cos(stemAxis * 9.0 - t * 1.8 - uSeed * 1.5) * 0.11 * stemAxis;
      float stemStrand1 = smoothstep(0.085, 0.0, abs(q.x - stemWave1)) * smoothstep(0.10, 0.96, stemAxis);
      float stemStrand2 = smoothstep(0.065, 0.0, abs(q.x - stemWave2)) * smoothstep(0.18, 0.92, stemAxis) * 0.72;
      float branchTendrils = (stemStrand1 + stemStrand2) * smoothstep(1.02, 0.36, abs(q.y));

      // Outer plane safety feather so rectangular mesh bounds never show
      float quadFeather =
        smoothstep(1.0, 0.72, abs(p.x)) *
        smoothstep(1.0, 0.78, abs(p.y));

      // 1. Deep Dimensional Interior Window (rEff < 0.54)
      float interiorMask = (1.0 - smoothstep(0.36, 0.55, rEff)) * quadFeather;

      // 2. Glowing Reality-Tear Lip & Flowing Energy Filaments around the fissure boundary
      float rimCore = exp(-pow((rEff - 0.43) / 0.062, 2.0)) * quadFeather;
      float rimOuter = exp(-pow((rEff - 0.49) / 0.145, 2.0)) * quadFeather;

      // Sample organic filament & energy stream textures along curved tear coordinates
      float texFil = 0.5;
      if (uHasFilament > 0.5) {
        vec2 filUv = vec2(
          0.5 + q.x * 0.36 + (n1 - 0.5) * 0.14,
          fract(0.5 + q.y * 0.38 - t * 0.12 + uSeed * 0.21)
        );
        texFil = texture2D(uFilamentTex, clamp(filUv, 0.02, 0.98)).r;
      }
      if (uHasStream > 0.5) {
        vec2 streamUv = vec2(
          fract(theta / 6.28318 + 0.5 + uSeed * 0.13),
          fract(r * 0.85 - t * 0.18 + n2 * 0.35)
        );
        float streamSample = texture2D(uStreamTex, streamUv).r;
        texFil = mix(texFil, max(texFil, streamSample), 0.52);
      }

      // Procedural flowing energy strands climbing around the tear perimeter
      float strandPattern = smoothstep(
        0.42,
        0.86,
        n2 * 0.62 + texFil * 0.48 + 0.24 * sin(theta * 6.0 + r * 9.0 - t * 2.2)
      );
      float energyStrands = rimOuter * strandPattern * (0.78 + 0.55 * uHover);

      // Soft atmospheric outer aura (restrained so portals never overpower the central trunk)
      float outerAura = exp(-pow(max(0.0, rEff - 0.34) / 0.28, 2.0)) * quadFeather;

      // Compose deep parallax interior world preview
      vec3 interiorCol = vec3(0.02, 0.04, 0.08);
      if (interiorMask > 0.004) {
        // Gentle reality-distortion refraction inside the tear
        vec2 refractOffset = vec2(
          (n1 - 0.5) * 0.045 + (n2 - 0.5) * 0.028,
          (n2 - 0.5) * 0.045 - (n1 - 0.5) * 0.028
        ) * (1.0 + 0.55 * uHover);

        // Deep window parallax offset driven by camera movement & branch direction
        vec2 parallaxUv = vec2(0.5, 0.52) +
                          vec2(q.x * 0.24, q.y * 0.30) -
                          uCameraOffset * 0.095 +
                          uBranchDir * 0.03 +
                          refractOffset +
                          vec2(sin(t * 0.22 + uSeed) * 0.015, cos(t * 0.18 + uSeed) * 0.014);

        if (uHasInterior > 0.5) {
          vec3 rawWorld = texture2D(uInteriorTex, clamp(parallaxUv, 0.04, 0.96)).rgb;
          // Deepen contrast and tint slightly with universe atmosphere so it feels distant and dimensional
          float worldLuma = dot(rawWorld, vec3(0.299, 0.587, 0.114));
          vec3 gradedWorld = mix(rawWorld * 0.78, uPrimaryColor * (0.35 + worldLuma * 0.85), 0.28);
          // Subtle internal dimensional depth vignette + inner edge illumination
          float innerDepth = smoothstep(0.50, 0.06, rEff);
          float innerRimGlow = smoothstep(0.16, 0.46, rEff);
          interiorCol = gradedWorld * (0.58 + 0.42 * innerDepth + 0.28 * uHover);
          interiorCol += mix(uPrimaryColor, uSecondaryColor, 0.45) * innerRimGlow * (0.22 + 0.24 * uHover);
        } else {
          interiorCol = mix(uPrimaryColor * 0.22, uSecondaryColor * 0.45, smoothstep(0.48, 0.0, rEff));
        }
      }

      // Golden-ivory cosmic tree root energy blending into universe identity along the stem & rim
      vec3 treeGold = vec3(1.00, 0.84, 0.46);
      vec3 ivory = vec3(1.00, 0.97, 0.90);
      vec3 strandCol = mix(uPrimaryColor, uSecondaryColor, 0.35 + 0.45 * n2);
      vec3 rimCol = mix(strandCol, ivory, (0.38 + 0.34 * uHover) * rimCore);
      vec3 stemCol = mix(treeGold, uPrimaryColor, smoothstep(0.95, 0.20, stemAxis) * (0.62 + 0.38 * uHover));

      float pulseMod = 1.0 + 0.14 * uTreePulse + 0.38 * uHover + 0.55 * uDiveBoost;

      vec3 col = interiorCol * interiorMask;
      col += rimCol * rimCore * (0.68 + 0.44 * uHover) * pulseMod;
      col += strandCol * energyStrands * 0.66 * pulseMod;
      col += stemCol * branchTendrils * (0.48 + 0.52 * uHover) * quadFeather;
      col += uPrimaryColor * outerAura * (0.16 + 0.22 * uHover + 0.12 * n1);

      // Soft filmic clamp so portals remain atmospheric and never outshine the central trunk
      vec3 over = max(vec3(0.0), col - vec3(0.82));
      col = min(col, vec3(0.82)) + over / (1.0 + over * 1.35);

      float alpha = clamp(
        interiorMask * 0.94 +
        rimCore * 0.88 +
        energyStrands * 0.72 +
        branchTendrils * 0.68 * quadFeather +
        outerAura * (0.24 + 0.20 * uHover),
        0.0,
        0.96
      );

      if (alpha < 0.012) discard;
      gl_FragColor = vec4(col, alpha);
    }
  `,
};

/**
 * PHASE 3 & PHASE 4 SHADER: Post-Processing Screen-Tear & Displacement Shader
 * Driven via EffectComposer during both the forward Dimensional Dive into a portal
 * and the reverse "Return to Nexus" zoom-out transition.
 */
const SCREEN_TEAR_POST_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uDistortion: { value: 0.0 },
    uFlash: { value: 0.0 },
    uDiveCenter: { value: null }, // THREE.Vector2
    uDiveColor: { value: null },  // THREE.Color
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uDistortion;
    uniform float uFlash;
    uniform vec2 uDiveCenter;
    uniform vec3 uDiveColor;

    varying vec2 vUv;

    float hash(float n) {
      return fract(sin(n) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;

      if (uDistortion > 0.001) {
        vec2 delta = uv - uDiveCenter;
        float dist = length(delta);
        vec2 dir = dist > 0.0001 ? delta / dist : vec2(0.0);

        // 1. Radial warp displacement toward the clicked portal
        float ripple = sin(dist * 14.0 - uTime * 16.0) * 0.045 * uDistortion * (1.0 - smoothstep(0.0, 0.9, dist));
        float zoomPull = pow(uDistortion, 1.5) * 0.28 * dist;

        // 2. Horizontal screen-tear fracture slices
        float bandIndex = floor(uv.y * 42.0 + uTime * 24.0);
        float bandRand = (hash(bandIndex) - 0.5) * 2.0;
        float tearActive = step(0.55, abs(bandRand)) * uDistortion;
        float tearOffset = bandRand * 0.068 * tearActive;

        vec2 warpedUv = uv - dir * zoomPull + dir * ripple + vec2(tearOffset, 0.0);
        warpedUv = clamp(warpedUv, 0.001, 0.999);

        // 3. Chromatic aberration split across the screen-tear seams
        float rgbSplit = (0.008 + 0.045 * pow(uDistortion, 1.4)) * (0.25 + dist);
        float r = texture2D(tDiffuse, clamp(warpedUv + dir * rgbSplit, 0.001, 0.999)).r;
        float g = texture2D(tDiffuse, warpedUv).g;
        float b = texture2D(tDiffuse, clamp(warpedUv - dir * rgbSplit, 0.001, 0.999)).b;

        vec3 col = vec3(r, g, b);

        // Dimensional rift seam luminescence + peak transition flash
        float seamGlow = tearActive * 0.35 + exp(-dist * 3.4) * uDistortion * 0.75;
        col = mix(col, uDiveColor * 1.35, clamp(seamGlow, 0.0, 0.85));
        col = mix(col, mix(uDiveColor, vec3(1.0), 0.7), clamp(uFlash, 0.0, 1.0));

        gl_FragColor = vec4(col, 1.0);
      } else {
        gl_FragColor = texture2D(tDiffuse, uv);
      }
    }
  `,
};

/* -------------------------------------------------------------------------- */
/* 5. MAIN 2.5D PARALLAX WORLD TREE GATEWAY CLASS                             */
/* -------------------------------------------------------------------------- */
export class MultiverseGateway {
  constructor(options = {}) {
    const THREE = window.THREE;
    if (!THREE) {
      throw new Error('Three.js (window.THREE) is required for MultiverseGateway.');
    }

    this.container = options.container;
    this.labelEl = options.labelEl;
    this.returnBtn = options.returnBtn;

    this.isTransitioning = false;
    this.isActive = true;
    this.lastEnteredPortal = UNIVERSE_PORTALS[0];

    this.isCoarsePointer =
      window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    this.prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Base camera coordinates & Phase 2 immersive 2.5D look-around state
    this.baseFov = 50;
    this.baseCameraPos = new THREE.Vector3(0, 0, 0);
    this.cameraLookTarget = new THREE.Vector3(0, 0, -30);

    // Normalized exploration state [-1, +1] and subtle cursor parallax [-1, +1]
    this.exploreTarget = { x: 0, y: 0 };
    this.exploreCurrent = { x: 0, y: 0 };
    this.cursorTarget = { x: 0, y: 0 };
    this.cursorCurrent = { x: 0, y: 0 };
    this.dragVelocity = { x: 0, y: 0 };

    this.cameraBounds = {
      camMaxX: 1.4,
      tiltMaxX: 1.5,
      camMaxUpY: 2.5,
      tiltMaxUpY: 4.5,
      camMaxDownY: 2.4,
      tiltMaxDownY: 4.3,
    };

    // Drag & touch interaction state (reused with zero per-frame allocations)
    this.isPointerDown = false;
    this.isDragging = false;
    this.wasDragged = false;
    this.activePointerId = null;
    this.activePointerType = 'mouse';
    this.pressX = 0;
    this.pressY = 0;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
    this.lastMoveAt = 0;
    this.lastInteractionAt = performance.now();
    this.hasExplored = false;

    // Raycaster, 7 organic branch corridors & dimensional tear portal nodes (zero per-frame allocations)
    this.raycaster = new THREE.Raycaster();
    this.pointerNDC = new THREE.Vector2(-999, -999);
    this._labelProjVec = new THREE.Vector3();
    this._rayPlaneIntersect = new THREE.Vector3();
    this.portalNodes = [];
    this._portalMeshes = [];
    this._interactiveMeshes = [];
    this.hoveredPortal = null;
    this.activeBranchNode = null;
    this.branchHoverState = {
      level: 0.0,
      target: 0.0,
      pulseTime: 0.0,
    };
    this.treeGlowState = { intensity: 1.0 };

    this.clock = new THREE.Clock();
    this.rafId = 0;

    this.initScene();
    this.buildParallaxLayers();
    this.buildCosmicParticles();
    this.buildUniversePortals();
    this.initPostProcessing();
    this.setupReturnToNexusHook();
    this.bindEvents();
    this.startLoop();
  }

  /**
   * Smart texture loader supporting explicit ordered candidate paths or automatic
   * .jpg/.png resolution so primary clean cosmic-tree textures load cleanly with
   * preserved legacy fallbacks.
   */
  loadTextureWithFallback(requestedPathOrCandidates, onLoad) {
    const THREE = window.THREE;
    const loader = new THREE.TextureLoader();

    const candidates = [];
    if (Array.isArray(requestedPathOrCandidates)) {
      candidates.push(...requestedPathOrCandidates);
    } else if (requestedPathOrCandidates.endsWith('.jpg')) {
      candidates.push(
        requestedPathOrCandidates.replace(/\.jpg$/i, '.png'),
        requestedPathOrCandidates
      );
    } else if (requestedPathOrCandidates.endsWith('.png')) {
      candidates.push(
        requestedPathOrCandidates,
        requestedPathOrCandidates.replace(/\.png$/i, '.jpg')
      );
    } else {
      candidates.push(requestedPathOrCandidates);
    }

    const tryNext = (idx) => {
      if (idx >= candidates.length) return;
      loader.load(
        candidates[idx],
        (texture) => {
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          if (THREE.sRGBEncoding) {
            texture.encoding = THREE.sRGBEncoding;
          }
          texture.needsUpdate = true;
          onLoad(texture);
        },
        undefined,
        () => tryNext(idx + 1)
      );
    };

    tryNext(0);
  }

  /**
   * Prepares the vortex texture with a circular radial vignette mask so that when
   * the portal PlaneGeometry rotates continuously on its Z-axis, the square corners
   * fade smoothly to pure black (0.0) for seamless AdditiveBlending.
   */
  createCircularMaskedVortexTexture(sourceTexture) {
    const THREE = window.THREE;
    const img = sourceTexture.image;
    if (!img) return sourceTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0, size, size);

    // Multiply with a circular radial gradient so corners outside r = 0.46 are pure black
    ctx.globalCompositeOperation = 'destination-in';
    const grad = ctx.createRadialGradient(
      size * 0.5,
      size * 0.5,
      size * 0.08,
      size * 0.5,
      size * 0.5,
      size * 0.47
    );
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.76, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const maskedTexture = new THREE.CanvasTexture(canvas);
    maskedTexture.minFilter = THREE.LinearFilter;
    maskedTexture.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding) {
      maskedTexture.encoding = THREE.sRGBEncoding;
    }
    maskedTexture.needsUpdate = true;
    return maskedTexture;
  }

  /**
   * Phase 1: Initializes the Gateway Scene, PerspectiveCamera (z = 0), and WebGLRenderer.
   */
  initScene() {
    const THREE = window.THREE;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.baseFov,
      width / height,
      0.1,
      200
    );
    this.camera.position.set(0, 0, 0);

    const isCoarse =
      window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isCoarse,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, isCoarse ? 1.5 : 2)
    );
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x02040a, 1);
    if (THREE.sRGBEncoding) {
      this.renderer.outputEncoding = THREE.sRGBEncoding;
    }

    this.renderer.domElement.className = 'gateway-canvas';
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Phase 1 + Phase 2 Depth Layer Stack:
   * - Layer 1  (Sky Backdrop @ z = -64): Minimal distant parallax
   * - Layer 1B (Distant Clouds @ z = -46): Subtle billowing atmospheric wisps
   * - Layer 2B (Upper Canopy @ z = -32.6): Moderate background branch parallax
   * - Layer 2  (Main Tree + Veins @ z = -30): Controlled central trunk focal plane
   * - Layer 2C (Lower Roots @ z = -24.5): Stronger lower-ground root parallax
   * - Layer 2D (Abyssal Mist @ z = -23.5): Deep atmospheric root-abyss blend
   * - Layer 3  (Foreground Framing Arches @ z = -10): Strong foreground parallax
   * - Layer 3B (Foreground Mist @ z = -8.2): Noticeable near-camera vapor parallax
   */
  buildParallaxLayers() {
    const THREE = window.THREE;
    const planeGeo = new THREE.PlaneGeometry(1, 1);
    const driftScale = this.prefersReducedMotion ? 0.22 : 1.0;

    // --- LAYER 1: Cosmic Cloud Sky Backdrop at z = -64 ---
    this.layer1Uniforms = {
      uTexture: { value: null },
      uHasTexture: { value: 0.0 },
    };
    this.layer1Material = new THREE.ShaderMaterial({
      uniforms: this.layer1Uniforms,
      vertexShader: SKY_BACKDROP_SHADER.vertexShader,
      fragmentShader: SKY_BACKDROP_SHADER.fragmentShader,
      depthWrite: false,
    });
    this.layer1Mesh = new THREE.Mesh(planeGeo, this.layer1Material);
    this.layer1Mesh.position.set(0, 0, -64);
    this.layer1Mesh.renderOrder = 1;
    this.scene.add(this.layer1Mesh);

    this.loadTextureWithFallback(
      [
        '/assets/cosmic-tree/environment/cosmic_cloud_sky_16x9.jpg',
        '/assets/layer1_bg.png',
      ],
      (tex) => {
        this.layer1Uniforms.uTexture.value = tex;
        this.layer1Uniforms.uHasTexture.value = 1.0;
      }
    );

    // --- LAYER 1B: Distant Volumetric Nebula Clouds at z = -46 ---
    this.distantCloudsUniforms = {
      uTime: { value: 0.0 },
      uDriftScale: { value: driftScale },
      uTreePulse: { value: 0.0 },
    };
    this.distantCloudsMaterial = new THREE.ShaderMaterial({
      uniforms: this.distantCloudsUniforms,
      vertexShader: DISTANT_CLOUDS_SHADER.vertexShader,
      fragmentShader: DISTANT_CLOUDS_SHADER.fragmentShader,
      transparent: true,
      depthWrite: false,
    });
    this.distantCloudsMesh = new THREE.Mesh(planeGeo, this.distantCloudsMaterial);
    this.distantCloudsMesh.position.set(0, 0, -46);
    this.distantCloudsMesh.renderOrder = 2;
    this.scene.add(this.distantCloudsMesh);

    // --- LAYER 2B: Upper Canopy Extension at z = -32.6 ---
    this.canopyUniforms = {
      uTexture: { value: null },
      uHasTexture: { value: 0.0 },
      uTime: { value: 0.0 },
      uDriftScale: { value: driftScale },
      uTreePulse: { value: 0.0 },
    };
    this.canopyMaterial = new THREE.ShaderMaterial({
      uniforms: this.canopyUniforms,
      vertexShader: CANOPY_EXTENSION_SHADER.vertexShader,
      fragmentShader: CANOPY_EXTENSION_SHADER.fragmentShader,
      transparent: true,
      depthWrite: false,
    });
    this.canopyMesh = new THREE.Mesh(planeGeo, this.canopyMaterial);
    this.canopyMesh.position.set(0, 0, -32.6);
    this.canopyMesh.renderOrder = 3;
    this.scene.add(this.canopyMesh);

    this.loadTextureWithFallback(
      ['/assets/cosmic-tree/tree/upper_canopy_and_branches.png'],
      (tex) => {
        this.canopyUniforms.uTexture.value = tex;
        this.canopyUniforms.uHasTexture.value = 1.0;
      }
    );

    // --- LAYER 2: Primary Clean World Tree + Registered Veins at z = -30 ---
    this.treeUniforms = {
      uBaseTexture: { value: null },
      uEmissiveMask: { value: null },
      uHasBase: { value: 0.0 },
      uHasMask: { value: 0.0 },
      uTime: { value: 0.0 },
      uDriftScale: { value: driftScale },
      uSpeed: { value: 2.6 },
      uFrequency: { value: 10.0 },
      uGlowIntensity: { value: 1.0 },
      uTreePulse: { value: 0.0 },
      uActiveBranchRoot: { value: new THREE.Vector2(0.5, 0.5) },
      uActiveBranchMid: { value: new THREE.Vector2(0.5, 0.5) },
      uActiveBranchEnd: { value: new THREE.Vector2(0.5, 0.5) },
      uActiveBranchColor: { value: new THREE.Color('#42d9ff') },
      uActiveBranchSecondary: { value: new THREE.Color('#bae6fd') },
      uActiveBranchHover: { value: 0.0 },
      uActiveBranchTime: { value: 0.0 },
    };

    this.layer2Material = new THREE.ShaderMaterial({
      uniforms: this.treeUniforms,
      vertexShader: WORLD_TREE_SHADER.vertexShader,
      fragmentShader: WORLD_TREE_SHADER.fragmentShader,
      transparent: true,
      depthWrite: false,
    });

    this.layer2Mesh = new THREE.Mesh(planeGeo, this.layer2Material);
    this.layer2Mesh.position.set(0, 0, -30);
    this.layer2Mesh.renderOrder = 4;
    this.scene.add(this.layer2Mesh);

    this.loadTextureWithFallback(
      [
        '/assets/cosmic-tree/tree/cosmic_tree_main_layer_clean.png',
        '/assets/layer2_tree.png',
      ],
      (tex) => {
        this.treeUniforms.uBaseTexture.value = tex;
        this.treeUniforms.uHasBase.value = 1.0;
      }
    );

    this.loadTextureWithFallback(['/assets/layer4_emissive.png'], (maskTex) => {
      if (THREE.LinearEncoding) {
        maskTex.encoding = THREE.LinearEncoding;
      }
      this.treeUniforms.uEmissiveMask.value = maskTex;
      this.treeUniforms.uHasMask.value = 1.0;
    });

    // --- LAYER 2C: Lower Roots & Ground Extension at z = -24.5 ---
    this.lowerRootsUniforms = {
      uTexture: { value: null },
      uHasTexture: { value: 0.0 },
      uTime: { value: 0.0 },
      uDriftScale: { value: driftScale },
      uTreePulse: { value: 0.0 },
    };
    this.lowerRootsMaterial = new THREE.ShaderMaterial({
      uniforms: this.lowerRootsUniforms,
      vertexShader: LOWER_ROOTS_SHADER.vertexShader,
      fragmentShader: LOWER_ROOTS_SHADER.fragmentShader,
      transparent: true,
      depthWrite: false,
    });
    this.lowerRootsMesh = new THREE.Mesh(planeGeo, this.lowerRootsMaterial);
    this.lowerRootsMesh.position.set(0, 0, -24.5);
    this.lowerRootsMesh.renderOrder = 5;
    this.scene.add(this.lowerRootsMesh);

    this.loadTextureWithFallback(
      ['/assets/cosmic-tree/tree/roots_and_ground_plate.png'],
      (tex) => {
        this.lowerRootsUniforms.uTexture.value = tex;
        this.lowerRootsUniforms.uHasTexture.value = 1.0;
      }
    );

    // --- LAYER 2D: Lower Abyssal Cosmic Cloud & Mist Veil at z = -23.5 ---
    this.abyssMistUniforms = {
      uTime: { value: 0.0 },
      uDriftScale: { value: driftScale },
      uTreePulse: { value: 0.0 },
    };
    this.abyssMistMaterial = new THREE.ShaderMaterial({
      uniforms: this.abyssMistUniforms,
      vertexShader: ABYSSAL_MIST_SHADER.vertexShader,
      fragmentShader: ABYSSAL_MIST_SHADER.fragmentShader,
      transparent: true,
      depthWrite: false,
    });
    this.abyssMistMesh = new THREE.Mesh(planeGeo, this.abyssMistMaterial);
    this.abyssMistMesh.position.set(0, 0, -23.5);
    this.abyssMistMesh.renderOrder = 6;
    this.scene.add(this.abyssMistMesh);

    // --- LAYER 3: Clean Foreground Root Framing Arches at z = -10 ---
    this.layer3Uniforms = {
      uTexture: { value: null },
      uHasTexture: { value: 0.0 },
    };

    this.layer3Material = new THREE.ShaderMaterial({
      uniforms: this.layer3Uniforms,
      vertexShader: FOREGROUND_ROOTS_SHADER.vertexShader,
      fragmentShader: FOREGROUND_ROOTS_SHADER.fragmentShader,
      transparent: true,
      depthWrite: false,
    });

    this.layer3Mesh = new THREE.Mesh(planeGeo, this.layer3Material);
    this.layer3Mesh.position.set(0, 0, -10);
    this.layer3Mesh.renderOrder = 8;
    this.scene.add(this.layer3Mesh);

    this.loadTextureWithFallback(
      [
        '/assets/cosmic-tree/tree/cosmic_roots_foreground_clean.png',
        '/assets/layer3_fg.png',
      ],
      (tex) => {
        this.layer3Uniforms.uTexture.value = tex;
        this.layer3Uniforms.uHasTexture.value = 1.0;
      }
    );

    // --- LAYER 3B: Foreground Drifting Cosmic Mist at z = -8.2 ---
    this.fgMistUniforms = {
      uTime: { value: 0.0 },
      uDriftScale: { value: driftScale },
      uTreePulse: { value: 0.0 },
    };
    this.fgMistMaterial = new THREE.ShaderMaterial({
      uniforms: this.fgMistUniforms,
      vertexShader: FOREGROUND_MIST_SHADER.vertexShader,
      fragmentShader: FOREGROUND_MIST_SHADER.fragmentShader,
      transparent: true,
      depthWrite: false,
    });
    this.fgMistMesh = new THREE.Mesh(planeGeo, this.fgMistMaterial);
    this.fgMistMesh.position.set(0, 0, -8.2);
    this.fgMistMesh.renderOrder = 9;
    this.scene.add(this.fgMistMesh);

    this.updateLayerScales();
  }

  /**
   * Pre-allocates a delicate GPU particle system concentrated along root, trunk,
   * and canopy energy conduits (z = -26.5 .. -6.2) with zero CPU frame updates.
   */
  buildCosmicParticles() {
    const THREE = window.THREE;
    const count = this.isCoarsePointer ? 64 : 132;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);
    const colorMix = new Float32Array(count);
    const channels = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const idx3 = i * 3;
      const role = Math.random();
      let px = 0;
      let py = 0;
      let pz = -14;
      let isChannel = 1.0;

      if (role < 0.38) {
        // Root-to-trunk central energy column
        py = -15.5 + Math.random() * 23.0;
        const rootBell = py < -4.0 ? 5.2 + ((-4.0 - py) / 11.5) * 10.5 : 4.6;
        px = (Math.random() - Math.random()) * rootBell;
        pz = -12.0 - Math.random() * 14.5;
      } else if (role < 0.75) {
        // Radiating upper canopy branch arcs
        const theta = (Math.random() - 0.5) * 2.52;
        const radius = 5.2 + Math.random() * 17.8;
        px = Math.sin(theta) * radius * 1.18;
        py = 1.4 + Math.cos(theta) * radius * 0.85;
        pz = -11.5 - Math.random() * 15.0;
      } else {
        // Ambient foreground/midground depth spores
        px = (Math.random() - 0.5) * 48.0;
        py = (Math.random() - 0.5) * 34.0;
        pz = -6.2 - Math.random() * 16.5;
        isChannel = 0.0;
      }

      positions[idx3] = px;
      positions[idx3 + 1] = py;
      positions[idx3 + 2] = pz;
      sizes[i] = 1.45 + Math.random() * 2.35;
      seeds[i] = Math.random();
      // Primarily golden-white (~82%) with occasional restrained cyan (~18%)
      colorMix[i] =
        Math.random() < 0.82
          ? 0.72 + Math.random() * 0.28
          : Math.random() * 0.3;
      channels[i] = isChannel;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute('aColorMix', new THREE.BufferAttribute(colorMix, 1));
    geometry.setAttribute('aChannel', new THREE.BufferAttribute(channels, 1));

    this.particleUniforms = {
      uTime: { value: 0.0 },
      uDriftScale: { value: this.prefersReducedMotion ? 0.22 : 1.0 },
      uPixelRatio: { value: this.renderer.getPixelRatio() },
      uTreePulse: { value: 0.0 },
      uActivePortalPos: { value: new THREE.Vector3(0, 0, -29.9) },
      uActivePortalColor: { value: new THREE.Color('#42d9ff') },
      uActiveBranchHover: { value: 0.0 },
    };

    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: this.particleUniforms,
      vertexShader: COSMIC_PARTICLES_SHADER.vertexShader,
      fragmentShader: COSMIC_PARTICLES_SHADER.fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.particlePoints = new THREE.Points(geometry, this.particleMaterial);
    this.particlePoints.renderOrder = 10;
    this.particlePoints.frustumCulled = false;
    this.scene.add(this.particlePoints);
  }

  /**
   * Computes frustum-covering plane dimensions at a given Z depth with overscan
   * so camera parallax movement never exposes the edges of any layer.
   */
  getDimensionsAtZ(zDepth, overscan = 1.22, aspectTarget = 16 / 9) {
    const THREE = window.THREE;
    const distance = Math.abs(this.baseCameraPos.z - zDepth);
    const vFovRad = THREE.MathUtils.degToRad(this.baseFov);
    const frustumHeight = 2 * Math.tan(vFovRad * 0.5) * distance;
    const frustumWidth = frustumHeight * this.camera.aspect;

    let width = frustumWidth * overscan;
    let height = width / aspectTarget;
    if (height < frustumHeight * overscan) {
      height = frustumHeight * overscan;
      width = height * aspectTarget;
    }
    return { width, height, frustumWidth, frustumHeight };
  }

  updateLayerScales() {
    if (!this.layer1Mesh || !this.layer2Mesh || !this.layer3Mesh) return;

    const d1 = this.getDimensionsAtZ(-64, 1.68);
    this.layer1Mesh.scale.set(d1.width, d1.height, 1);

    if (this.distantCloudsMesh) {
      const dc = this.getDimensionsAtZ(-46, 1.62);
      this.distantCloudsMesh.scale.set(dc.width, dc.height, 1);
    }

    const d2 = this.getDimensionsAtZ(-30, 1.16);
    this.layer2Mesh.scale.set(d2.width, d2.height, 1);
    this.treeDimensions = d2;

    if (this.canopyMesh) {
      const canopyRatio = Math.abs(-32.6 / -30);
      const canopyW = d2.width * canopyRatio * 1.12;
      const canopyH = canopyW * (875 / 2752);
      this.canopyBaseY = d2.height * canopyRatio * 0.48;
      this.canopyMesh.scale.set(canopyW, canopyH, 1);
      this.canopyMesh.position.set(0, this.canopyBaseY, -32.6);
    }

    if (this.lowerRootsMesh) {
      const lowerRatio = Math.abs(-24.5 / -30);
      const lowerW = d2.width * lowerRatio * 1.16;
      const lowerH = lowerW * (799 / 2752);
      this.lowerRootsBaseY = -d2.height * lowerRatio * 0.445;
      this.lowerRootsMesh.scale.set(lowerW, lowerH, 1);
      this.lowerRootsMesh.position.set(0, this.lowerRootsBaseY, -24.5);
    }

    if (this.abyssMistMesh) {
      const abyssRatio = Math.abs(-23.5 / -30);
      const abyssW = d2.width * abyssRatio * 1.38;
      const abyssH = d2.height * abyssRatio * 0.85;
      this.abyssBaseY = -d2.height * abyssRatio * 0.56;
      this.abyssMistMesh.scale.set(abyssW, abyssH, 1);
      this.abyssMistMesh.position.set(0, this.abyssBaseY, -23.5);
    }

    const d3 = this.getDimensionsAtZ(-10, 1.38);
    this.layer3Mesh.scale.set(d3.width, d3.height, 1);
    this.layer3Dimensions = d3;

    if (this.fgMistMesh) {
      const fgm = this.getDimensionsAtZ(-8.2, 1.56);
      this.fgMistMesh.scale.set(fgm.width, fgm.height, 1);
    }

    // Recompute viewport-adaptive camera limits so no layer border can ever enter view
    const slackX = Math.max(0, (d2.width - d2.frustumWidth) * 0.5);
    const maxViewX = Math.min(14.0, Math.max(2.65, slackX * 0.72));
    const camMaxX = Math.min(2.25, maxViewX * 0.44);
    const tiltMaxX = maxViewX - camMaxX;

    const maxViewUpY = d2.frustumHeight * 0.255;
    const camMaxUpY = Math.min(2.55, maxViewUpY * 0.38);
    const tiltMaxUpY = maxViewUpY - camMaxUpY;

    const maxViewDownY = d2.frustumHeight * 0.245;
    const camMaxDownY = Math.min(2.45, maxViewDownY * 0.38);
    const tiltMaxDownY = maxViewDownY - camMaxDownY;

    this.cameraBounds = {
      camMaxX,
      tiltMaxX,
      camMaxUpY,
      tiltMaxUpY,
      camMaxDownY,
      tiltMaxDownY,
    };

    if (this.particleUniforms) {
      this.particleUniforms.uPixelRatio.value = this.renderer.getPixelRatio();
    }

    this.updatePortalPositions();
  }

  /**
   * Phase 4: Builds the 7 organic dimensional reality-tear portals and their
   * interactive branch hit corridors at z = -29.88 on the World Tree boughs.
   * - Each portal uses DIMENSIONAL_PORTAL_SHADER with its universe's authentic
   *   interior artwork (`/assets/<id>-bg.webp`), flowing energy filament textures,
   *   and elongated organic orientation aligned with its branch.
   * - Also creates an invisible oriented branch hit-corridor mesh per branch so
   *   hovering or tapping either the branch OR its portal activates the destination.
   */
  buildUniversePortals() {
    const THREE = window.THREE;
    const portalGeo = new THREE.PlaneGeometry(1, 1);
    const branchHitGeo = new THREE.PlaneGeometry(1, 1);
    const branchHitMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      colorWrite: false,
    });
    const driftScale = this.prefersReducedMotion ? 0.22 : 1.0;

    UNIVERSE_PORTALS.forEach((cfg) => {
      const primaryColor = new THREE.Color(cfg.color);
      const secondaryColor = new THREE.Color(cfg.secondaryColor || cfg.color);

      const uniforms = {
        uInteriorTex: { value: null },
        uFilamentTex: { value: null },
        uStreamTex: { value: null },
        uHasInterior: { value: 0.0 },
        uHasFilament: { value: 0.0 },
        uHasStream: { value: 0.0 },
        uTime: { value: 0.0 },
        uDriftScale: { value: driftScale },
        uHover: { value: 0.0 },
        uDiveBoost: { value: 0.0 },
        uSeed: { value: cfg.seed || 1.0 },
        uTreePulse: { value: 0.0 },
        uPrimaryColor: { value: primaryColor },
        uSecondaryColor: { value: secondaryColor },
        uCameraOffset: { value: new THREE.Vector2(0, 0) },
        uBranchDir: {
          value: new THREE.Vector2(cfg.branchDir[0], cfg.branchDir[1]),
        },
      };

      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: DIMENSIONAL_PORTAL_SHADER.vertexShader,
        fragmentShader: DIMENSIONAL_PORTAL_SHADER.fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      });

      const mesh = new THREE.Mesh(portalGeo, material);
      mesh.position.set(0, 0, -29.88);
      mesh.rotation.z = cfg.tilt || 0;
      mesh.renderOrder = 7;
      mesh.userData = { ...cfg, isPortal: true };
      this.scene.add(mesh);

      // Invisible interactive corridor along the branch from trunk junction to portal
      const branchHitMesh = new THREE.Mesh(branchHitGeo, branchHitMat);
      branchHitMesh.position.set(0, 0, -29.92);
      branchHitMesh.renderOrder = 6;
      branchHitMesh.userData = { ...cfg, isBranchCollider: true };
      this.scene.add(branchHitMesh);

      const node = {
        cfg,
        mesh,
        branchHitMesh,
        material,
        uniforms,
        primaryColor,
        secondaryColor,
        baseScale: 5.4,
        aspectX: cfg.aspect ? cfg.aspect[0] : 0.78,
        aspectY: cfg.aspect ? cfg.aspect[1] : 1.28,
        animState: {
          scaleFactor: 1.0,
          hoverLevel: 0.0,
          diveBoost: 0.0,
        },
      };

      this.portalNodes.push(node);

      // Load each universe's authentic panoramic world artwork for the deep portal interior
      if (cfg.interiorBg) {
        this.loadTextureWithFallback([cfg.interiorBg], (worldTex) => {
          uniforms.uInteriorTex.value = worldTex;
          uniforms.uHasInterior.value = 1.0;
        });
      }
    });

    this._portalMeshes = this.portalNodes.map((n) => n.mesh);
    this._interactiveMeshes = [];
    this.portalNodes.forEach((n) => {
      this._interactiveMeshes.push(n.mesh, n.branchHitMesh);
    });

    // Load shared organic energy filament & stream textures for the reality-tear rims
    this.loadTextureWithFallback(
      ['/assets/portal_vortex.png', '/assets/portal_vortex.jpg'],
      (rawTex) => {
        const vortexTex = this.createCircularMaskedVortexTexture(rawTex);
        this.portalNodes.forEach((node) => {
          node.uniforms.uFilamentTex.value = vortexTex;
          node.uniforms.uHasFilament.value = 1.0;
        });
      }
    );

    this.loadTextureWithFallback(
      ['/assets/cosmic-tree/energy/flowing_energy_streams.png'],
      (streamTex) => {
        this.portalNodes.forEach((node) => {
          node.uniforms.uStreamTex.value = streamTex;
          node.uniforms.uHasStream.value = 1.0;
        });
      }
    );

    this.updatePortalPositions();
  }

  /**
   * Positions and scales the 7 elongated reality-tear portals and their branch
   * hit-corridors at z = -29.88 on the World Tree branches across viewports.
   */
  updatePortalPositions() {
    if (!this.portalNodes || !this.portalNodes.length || !this.treeDimensions) {
      return;
    }

    const { width, height, frustumWidth, frustumHeight } = this.treeDimensions;
    const spanX = Math.min(width * 0.88, frustumWidth * 0.86);
    const spanY = Math.min(height * 0.88, frustumHeight * 0.82);
    const baseSize = Math.max(4.6, Math.min(6.8, frustumWidth * 0.135));

    this.portalNodes.forEach((node) => {
      node.baseScale = baseSize;
      const wx = node.cfg.nx * spanX;
      const wy = node.cfg.ny * spanY;
      node.mesh.position.set(wx, wy, -29.88);
      node.mesh.rotation.z = node.cfg.tilt || 0;

      const s = node.baseScale * node.animState.scaleFactor;
      node.mesh.scale.set(s * node.aspectX, s * node.aspectY, 1);

      // Align the invisible branch corridor from the branch root UV to the portal position
      if (node.branchHitMesh && node.cfg.rootUv) {
        const rootWx = (node.cfg.rootUv[0] - 0.5) * width;
        const rootWy = (node.cfg.rootUv[1] - 0.5) * height;
        const midX = (rootWx + wx) * 0.5;
        const midY = (rootWy + wy) * 0.5;
        const dx = wx - rootWx;
        const dy = wy - rootWy;
        const len = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const corridorWidth = Math.max(2.3, baseSize * 0.48);

        node.branchHitMesh.position.set(midX, midY, -29.92);
        node.branchHitMesh.rotation.z = angle;
        node.branchHitMesh.scale.set(len + baseSize * 0.45, corridorWidth, 1);
      }
    });
  }

  /**
   * Evaluates both 3D portal/branch collider meshes and analytical UV quadratic-Bezier
   * branch spine proximity on the z = -30 World Tree plane so hovering or tapping
   * any of the 7 major branches or their portals reliably detects that destination.
   */
  findDestinationAtPointer(ndc) {
    if (!this.portalNodes || !this.portalNodes.length) return null;

    this.raycaster.setFromCamera(ndc, this.camera);

    // 1. Direct raycast against the 7 portal tear meshes first (highest priority)
    const portalHits = this.raycaster.intersectObjects(this._portalMeshes, false);
    if (portalHits.length > 0) {
      const hitMesh = portalHits[0].object;
      const directNode = this.portalNodes.find((n) => n.mesh === hitMesh);
      if (directNode) return directNode;
    }

    // 2. Analytical UV quadratic-Bezier branch curve & portal proximity check on z = -30 plane
    if (this.treeDimensions && this.raycaster.ray.direction.z !== 0) {
      const tPlane =
        (-29.9 - this.raycaster.ray.origin.z) / this.raycaster.ray.direction.z;
      if (tPlane > 0) {
        this._rayPlaneIntersect
          .copy(this.raycaster.ray.direction)
          .multiplyScalar(tPlane)
          .add(this.raycaster.ray.origin);

        const u = this._rayPlaneIntersect.x / this.treeDimensions.width + 0.5;
        const v = this._rayPlaneIntersect.y / this.treeDimensions.height + 0.5;

        if (u >= 0.14 && u <= 0.86 && v >= 0.34 && v <= 0.80) {
          let bestNode = null;
          let bestScore = 1.0;

          for (let i = 0; i < this.portalNodes.length; i++) {
            const node = this.portalNodes[i];
            const [r0x, r0y] = node.cfg.rootUv;
            const [r1x, r1y] = node.cfg.midUv;
            const [r2x, r2y] = node.cfg.portalUv;

            // Check distance to portal endpoint in aspect-corrected UV space
            const dPortal = Math.hypot((u - r2x) * 1.78, v - r2y);
            if (dPortal < 0.068 && dPortal * 0.85 < bestScore) {
              bestScore = dPortal * 0.85;
              bestNode = node;
            }

            // Sample 6 segments along quadratic Bezier branch spine (root -> mid -> portal)
            let prevX = r0x;
            let prevY = r0y;
            for (let s = 1; s <= 6; s++) {
              const t = s / 6;
              const inv = 1 - t;
              const curX = inv * inv * r0x + 2 * inv * t * r1x + t * t * r2x;
              const curY = inv * inv * r0y + 2 * inv * t * r1y + t * t * r2y;

              const pax = (u - prevX) * 1.78;
              const pay = v - prevY;
              const bax = (curX - prevX) * 1.78;
              const bay = curY - prevY;
              const denom = Math.max(0.000001, bax * bax + bay * bay);
              const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / denom));
              const dist = Math.hypot(pax - bax * h, pay - bay * h);
              const progress = (s - 1 + h) / 6;
              const maxCorridor = 0.036 + progress * 0.014;

              if (dist < maxCorridor && dist < bestScore) {
                bestScore = dist;
                bestNode = node;
              }

              prevX = curX;
              prevY = curY;
            }
          }

          if (bestNode) return bestNode;
        }
      }
    }

    // 3. Fallback raycast against oriented branch collider meshes
    if (this._interactiveMeshes && this._interactiveMeshes.length) {
      const branchHits = this.raycaster.intersectObjects(
        this._interactiveMeshes,
        false
      );
      if (branchHits.length > 0) {
        const hitObj = branchHits[0].object;
        const matched = this.portalNodes.find(
          (n) => n.mesh === hitObj || n.branchHitMesh === hitObj
        );
        if (matched) return matched;
      }
    }

    return null;
  }

  /**
   * Phase 4: Smoothly activates the hovered branch's energy veins, directional
   * branch pulse, dimensional portal opening, local particle response, and
   * restrained universe destination label.
   */
  setHoveredPortal(targetNode) {
    if (this.hoveredPortal === targetNode) return;

    // Smoothly return previously hovered portal to its resting state
    if (this.hoveredPortal) {
      const prev = this.hoveredPortal;
      gsap.to(prev.animState, {
        scaleFactor: 1.0,
        hoverLevel: 0.0,
        duration: 0.55,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: () => {
          const s = prev.baseScale * prev.animState.scaleFactor;
          prev.mesh.scale.set(s * prev.aspectX, s * prev.aspectY, 1);
          prev.uniforms.uHover.value = prev.animState.hoverLevel;
        },
      });
    }

    this.hoveredPortal = targetNode;

    if (targetNode) {
      this.activeBranchNode = targetNode;
      this.branchHoverState.target = 1.0;
      this.branchHoverState.pulseTime = 0.0;

      // Bind active branch Bezier coordinates & universe color identity to tree + particle shaders
      if (this.treeUniforms) {
        this.treeUniforms.uActiveBranchRoot.value.set(
          targetNode.cfg.rootUv[0],
          targetNode.cfg.rootUv[1]
        );
        this.treeUniforms.uActiveBranchMid.value.set(
          targetNode.cfg.midUv[0],
          targetNode.cfg.midUv[1]
        );
        this.treeUniforms.uActiveBranchEnd.value.set(
          targetNode.cfg.portalUv[0],
          targetNode.cfg.portalUv[1]
        );
        this.treeUniforms.uActiveBranchColor.value.copy(targetNode.primaryColor);
        this.treeUniforms.uActiveBranchSecondary.value.copy(
          targetNode.secondaryColor
        );
      }

      if (this.particleUniforms) {
        this.particleUniforms.uActivePortalPos.value.copy(
          targetNode.mesh.position
        );
        this.particleUniforms.uActivePortalColor.value.copy(
          targetNode.primaryColor
        );
      }

      this.renderer.domElement.style.cursor = 'pointer';

      // Smoothly open and illuminate the dimensional tear on the branch
      gsap.to(targetNode.animState, {
        scaleFactor: 1.22,
        hoverLevel: 1.0,
        duration: 0.48,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: () => {
          const s = targetNode.baseScale * targetNode.animState.scaleFactor;
          targetNode.mesh.scale.set(
            s * targetNode.aspectX,
            s * targetNode.aspectY,
            1
          );
          targetNode.uniforms.uHover.value = targetNode.animState.hoverLevel;
        },
      });

      // Subtle overall tree sympathy lift while localized branch surge carries the focus
      gsap.to(this.treeGlowState, {
        intensity: 1.18,
        duration: 0.45,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: () => {
          this.treeUniforms.uGlowIntensity.value = this.treeGlowState.intensity;
        },
      });

      // Reveal restrained, atmospheric universe destination label
      if (this.labelEl) {
        this.labelEl.innerHTML = `
          <span class="gateway-portal-label-meta">${targetNode.cfg.sector} &nbsp;·&nbsp; ${targetNode.cfg.branchName}</span>
          <span class="gateway-portal-label-title">${targetNode.cfg.title}</span>
        `;
        this.labelEl.style.setProperty('--portal-color', targetNode.cfg.color);
        this.labelEl.style.setProperty(
          '--portal-secondary',
          targetNode.cfg.secondaryColor || targetNode.cfg.color
        );
        this.labelEl.classList.add('is-visible');
        this.updateHoveredLabelPosition();
      }
    } else {
      this.branchHoverState.target = 0.0;
      this.renderer.domElement.style.cursor = this.isDragging
        ? 'grabbing'
        : 'grab';

      gsap.to(this.treeGlowState, {
        intensity: 1.0,
        duration: 0.55,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: () => {
          this.treeUniforms.uGlowIntensity.value = this.treeGlowState.intensity;
        },
      });

      if (this.labelEl) {
        this.labelEl.classList.remove('is-visible');
      }
    }
  }

  /**
   * Projects the hovered portal's 3D coordinates onto 2D screen space and positions
   * the restrained universe label cleanly outward from the central trunk while
   * clamping within viewport margins on desktop and mobile.
   */
  updateHoveredLabelPosition() {
    if (!this.hoveredPortal || !this.labelEl) return;
    this._labelProjVec.copy(this.hoveredPortal.mesh.position);
    this._labelProjVec.project(this.camera);

    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;
    const rawX = (this._labelProjVec.x * 0.5 + 0.5) * vw;
    const rawY = (-this._labelProjVec.y * 0.5 + 0.5) * vh;

    // Offset slightly outward from the central trunk so the label never covers tree branches
    const nx = this.hoveredPortal.cfg.nx || 0;
    const sideShift = nx < -0.05 ? -18 : nx > 0.05 ? 18 : 0;
    const verticalOffset = Math.max(46, Math.min(72, vh * 0.068));

    const clampedX = Math.max(108, Math.min(vw - 108, rawX + sideShift));
    const clampedY = Math.max(88, Math.min(vh - 76, rawY - verticalOffset));

    this.labelEl.style.transform = `translate3d(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px, 0) translate(-50%, -100%)`;
  }

  /**
   * Phase 3: Initializes the EffectComposer with RenderPass and the custom GLSL
   * Screen-Tear / Displacement ShaderPass.
   */
  initPostProcessing() {
    const THREE = window.THREE;
    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.tearPass = new ShaderPass(SCREEN_TEAR_POST_SHADER);
    this.tearPass.uniforms.uDiveCenter.value = new THREE.Vector2(0.5, 0.5);
    this.tearPass.uniforms.uDiveColor.value = new THREE.Color('#42d9ff');
    this.composer.addPass(this.tearPass);
  }

  /**
   * Phase 3: The Dimensional Dive & Handoff
   * 1. Rapidly animates the camera's Z position forward past the roots directly
   *    into the clicked portal's X/Y coordinates.
   * 2. Widens the camera FOV dramatically to simulate warp speed.
   * 3. Activates the custom GLSL post-processing screen-tear shader via EffectComposer.
   * 4. At peak distortion, hides the gateway canvas and calls `window.VisionexaUniverse.enter(id)`.
   */
  triggerDimensionalDive(portalNode) {
    if (this.isTransitioning || !portalNode) return;
    this.isTransitioning = true;
    this.lastEnteredPortal = portalNode.cfg;

    const THREE = window.THREE;
    const targetId = portalNode.cfg.id;
    const portalPos = portalNode.mesh.position.clone();

    // Project clicked portal to screen UV (0..1) for the radial screen-tear origin
    const projected = portalPos.clone().project(this.camera);
    this.tearPass.uniforms.uDiveCenter.value.set(
      THREE.MathUtils.clamp(projected.x * 0.5 + 0.5, 0.1, 0.9),
      THREE.MathUtils.clamp(projected.y * 0.5 + 0.5, 0.1, 0.9)
    );
    this.tearPass.uniforms.uDiveColor.value.set(portalNode.cfg.color);

    // Hide the floating label and header UI during the warp dive
    if (this.labelEl) this.labelEl.classList.remove('is-visible');
    this.container.classList.add('gateway-diving');

    // Expand and illuminate the clicked reality tear as the camera dives into it
    gsap.to(portalNode.animState, {
      scaleFactor: 2.45,
      hoverLevel: 1.0,
      diveBoost: 1.0,
      duration: 1.05,
      ease: 'expo.in',
      overwrite: true,
      onUpdate: () => {
        const s = portalNode.baseScale * portalNode.animState.scaleFactor;
        portalNode.mesh.scale.set(
          s * portalNode.aspectX,
          s * portalNode.aspectY,
          1
        );
        portalNode.uniforms.uHover.value = portalNode.animState.hoverLevel;
        portalNode.uniforms.uDiveBoost.value = portalNode.animState.diveBoost;
      },
    });

    const diveState = {
      camX: this.camera.position.x,
      camY: this.camera.position.y,
      camZ: this.camera.position.z,
      lookX: this.cameraLookTarget.x,
      lookY: this.cameraLookTarget.y,
      fov: this.camera.fov,
      distortion: 0.0,
      flash: 0.0,
    };

    const tl = gsap.timeline();

    // 1 & 2. Rapidly fly camera X/Y/Z into the portal and widen FOV for warp speed
    tl.to(
      diveState,
      {
        camX: portalPos.x * 0.92,
        camY: portalPos.y * 0.92,
        camZ: -29.2,
        lookX: portalPos.x,
        lookY: portalPos.y,
        fov: 116,
        duration: 1.08,
        ease: 'power3.in',
        onUpdate: () => {
          this.camera.position.set(diveState.camX, diveState.camY, diveState.camZ);
          this.cameraLookTarget.set(diveState.lookX, diveState.lookY, -30);
          this.camera.lookAt(this.cameraLookTarget);
          this.camera.fov = diveState.fov;
          this.camera.updateProjectionMatrix();
        },
      },
      0
    );

    // 3. Simultaneously rip the screen apart via the EffectComposer screen-tear shader
    tl.to(
      diveState,
      {
        distortion: 1.0,
        duration: 1.04,
        ease: 'power2.in',
        onUpdate: () => {
          this.tearPass.uniforms.uDistortion.value = diveState.distortion;
        },
      },
      0
    );

    tl.to(
      diveState,
      {
        flash: 0.95,
        duration: 0.28,
        ease: 'power2.in',
        onUpdate: () => {
          this.tearPass.uniforms.uFlash.value = diveState.flash;
        },
      },
      0.8
    );

    // 4. At peak distortion, hide the gateway canvas and call window.VisionexaUniverse.enter(id)
    tl.call(
      () => {
        this.isActive = false;
        this.container.style.opacity = '0';
        this.container.style.pointerEvents = 'none';
        setTimeout(() => {
          if (!this.isActive) {
            this.container.style.display = 'none';
          }
        }, 320);

        if (
          window.VisionexaUniverse &&
          typeof window.VisionexaUniverse.enter === 'function'
        ) {
          window.VisionexaUniverse.enter(targetId);
        }

        this.showReturnButton();
        this.isTransitioning = false;
      },
      [],
      1.08
    );
  }

  /**
   * Fades in the `#return-to-nexus` button when entering a universe.
   */
  showReturnButton() {
    if (!this.returnBtn) return;
    this.returnBtn.style.display = 'inline-flex';
    const state = { opacity: 0 };
    gsap.to(state, {
      opacity: 1,
      duration: 0.35,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: () => {
        this.returnBtn.style.opacity = String(state.opacity);
      },
    });
  }

  /**
   * Hides the `#return-to-nexus` button when returning to the gateway.
   */
  hideReturnButton() {
    if (!this.returnBtn) return;
    this.returnBtn.style.opacity = '0';
    this.returnBtn.style.display = 'none';
  }

  /**
   * Phase 4: "Return to Gateway" Navigation Loop
   * - Wraps `window.VisionexaUniverse.enter` so `#return-to-nexus` fades in
   *   whenever a universe is entered.
   * - On clicking `#return-to-nexus`, reverses the transition: shows the gateway
   *   canvas, triggers a quick screen tear, zooms the camera back out from the
   *   portal to z = 0, hides the button, and hides the panoramic city view.
   */
  setupReturnToNexusHook() {
    if (
      window.VisionexaUniverse &&
      typeof window.VisionexaUniverse.enter === 'function' &&
      !window.VisionexaUniverse._nexusWrapped
    ) {
      const originalEnter = window.VisionexaUniverse.enter.bind(
        window.VisionexaUniverse
      );
      window.VisionexaUniverse.enter = (targetUniverseId) => {
        const matched = UNIVERSE_PORTALS.find((p) => p.id === targetUniverseId);
        if (matched) this.lastEnteredPortal = matched;
        const result = originalEnter(targetUniverseId);
        this.showReturnButton();
        return result;
      };
      window.VisionexaUniverse._nexusWrapped = true;
    }

    if (this.returnBtn) {
      this.returnBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.returnToNexus();
      });
    }
  }

  /**
   * Reverses the dimensional dive transition when the visitor clicks "RETURN TO NEXUS".
   */
  returnToNexus() {
    if (this.isTransitioning || this.isActive) return;
    this.isTransitioning = true;

    // 1. Hide the Return to Nexus button
    this.hideReturnButton();

    // 2. Unmount/hide the panoramic city stage by restoring `body.gateway-active`
    //    and pausing any active universe background video
    document.body.classList.add('gateway-active');
    document.querySelectorAll('video').forEach((v) => {
      try {
        v.pause();
      } catch {
        // ignore video pause errors
      }
    });

    // Reset all portal scales and hover/dive uniforms to normal resting state
    this.setHoveredPortal(null);
    this.branchHoverState.level = 0.0;
    this.branchHoverState.target = 0.0;
    if (this.treeUniforms) {
      this.treeUniforms.uActiveBranchHover.value = 0.0;
    }
    if (this.particleUniforms) {
      this.particleUniforms.uActiveBranchHover.value = 0.0;
    }
    this.portalNodes.forEach((node) => {
      node.animState.scaleFactor = 1.0;
      node.animState.hoverLevel = 0.0;
      node.animState.diveBoost = 0.0;
      const s = node.baseScale;
      node.mesh.scale.set(s * node.aspectX, s * node.aspectY, 1);
      node.uniforms.uHover.value = 0.0;
      node.uniforms.uDiveBoost.value = 0.0;
    });

    // 3. Show the gateway canvas starting at the portal coordinates in a torn/warped state
    this.isActive = true;
    this.container.style.display = 'block';
    void this.container.offsetWidth;
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'auto';

    const portalNode =
      this.portalNodes.find((n) => n.cfg.id === this.lastEnteredPortal?.id) ||
      this.portalNodes[0];
    const portalPos = portalNode.mesh.position.clone();

    this.tearPass.uniforms.uDiveCenter.value.set(0.5, 0.5);
    this.tearPass.uniforms.uDiveColor.value.set(portalNode.cfg.color);

    const reverseState = {
      camX: portalPos.x * 0.9,
      camY: portalPos.y * 0.9,
      camZ: -28.8,
      lookX: portalPos.x,
      lookY: portalPos.y,
      fov: 112,
      distortion: 0.95,
      flash: 0.75,
    };

    this.exploreTarget.x = 0;
    this.exploreTarget.y = 0;
    this.exploreCurrent.x = 0;
    this.exploreCurrent.y = 0;
    this.cursorTarget.x = 0;
    this.cursorTarget.y = 0;
    this.cursorCurrent.x = 0;
    this.cursorCurrent.y = 0;
    this.dragVelocity.x = 0;
    this.dragVelocity.y = 0;
    this.hasExplored = false;

    if (this.layer1Mesh) this.layer1Mesh.position.set(0, 0, -64);
    if (this.distantCloudsMesh) this.distantCloudsMesh.position.set(0, 0, -46);
    if (this.canopyMesh) this.canopyMesh.position.set(0, this.canopyBaseY || 0, -32.6);
    if (this.layer3Mesh) this.layer3Mesh.position.set(0, 0, -10);

    const tl = gsap.timeline();

    // Zoom camera back out from the portal (z = -28.8) to starting position (z = 0)
    // and restore normal FOV (50 deg)
    tl.to(
      reverseState,
      {
        camX: 0,
        camY: 0,
        camZ: 0,
        lookX: 0,
        lookY: 0,
        fov: this.baseFov,
        duration: 1.05,
        ease: 'expo.out',
        onUpdate: () => {
          this.camera.position.set(
            reverseState.camX,
            reverseState.camY,
            reverseState.camZ
          );
          this.cameraLookTarget.set(reverseState.lookX, reverseState.lookY, -30);
          this.camera.lookAt(this.cameraLookTarget);
          this.camera.fov = reverseState.fov;
          this.camera.updateProjectionMatrix();
        },
      },
      0
    );

    // Settle the quick screen-tear distortion & flash back to 0
    tl.to(
      reverseState,
      {
        distortion: 0.0,
        flash: 0.0,
        duration: 0.92,
        ease: 'power3.out',
        onUpdate: () => {
          this.tearPass.uniforms.uDistortion.value = reverseState.distortion;
          this.tearPass.uniforms.uFlash.value = reverseState.flash;
        },
      },
      0
    );

    tl.call(
      () => {
        this.container.classList.remove('gateway-diving');
        this.isTransitioning = false;
      },
      [],
      1.05
    );
  }

  /**
   * Binds desktop cursor parallax, click-and-drag + scroll look-around,
   * mobile one-finger touch dragging (preventing page scroll), click-to-dive
   * portal raycasting, and responsive resize handling.
   */
  bindEvents() {
    const clamp = window.THREE.MathUtils.clamp;

    this._onPointerDown = (e) => {
      if (!this.isActive || this.isTransitioning) return;
      if (e.target.closest('button, a, [data-interactive="true"]')) return;

      this.isPointerDown = true;
      this.isDragging = false;
      this.wasDragged = false;
      this.activePointerId = e.pointerId;
      this.activePointerType =
        e.pointerType || (this.isCoarsePointer ? 'touch' : 'mouse');
      this.pressX = e.clientX;
      this.pressY = e.clientY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.lastMoveAt = performance.now();
      this.lastInteractionAt = this.lastMoveAt;
      this.dragVelocity.x = 0;
      this.dragVelocity.y = 0;

      // On touch devices, immediately preview branch & portal activation when pressing a branch/portal;
      // if the user begins dragging (> 6px), hover is cancelled cleanly in _onPointerMove.
      if (this.activePointerType === 'touch' || this.isCoarsePointer) {
        const width = window.innerWidth || 1;
        const height = window.innerHeight || 1;
        this.pointerNDC.set(
          (e.clientX / width) * 2 - 1,
          -(e.clientY / height) * 2 + 1
        );
        const touchedNode = this.findDestinationAtPointer(this.pointerNDC);
        if (touchedNode) {
          this.setHoveredPortal(touchedNode);
        }
      }
    };

    this._onPointerMove = (e) => {
      if (!this.isActive || this.isTransitioning) return;

      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      const nx = (e.clientX / width) * 2 - 1;
      const ny = -(e.clientY / height) * 2 + 1;
      const now = performance.now();

      this.pointerNDC.set(nx, ny);

      // Update subtle desktop cursor parallax when moving mouse without dragging
      if (e.pointerType !== 'touch' && !this.isCoarsePointer) {
        this.cursorTarget.x = clamp(nx, -1, 1);
        this.cursorTarget.y = clamp(ny, -1, 1);
      }

      if (this.isPointerDown && e.pointerId === this.activePointerId) {
        const totalDist = Math.hypot(
          e.clientX - this.pressX,
          e.clientY - this.pressY
        );

        if (!this.isDragging && totalDist > 6) {
          this.isDragging = true;
          this.wasDragged = true;
          this.hasExplored = true;
          this.setHoveredPortal(null);
          this.container.classList.add('is-dragging');
          this.renderer.domElement.style.cursor = 'grabbing';
          if (this.container.setPointerCapture) {
            try {
              this.container.setPointerCapture(e.pointerId);
            } catch {
              // ignore pointer capture failure
            }
          }
        }

        if (this.isDragging) {
          const dx = e.clientX - this.lastPointerX;
          const dy = e.clientY - this.lastPointerY;
          const dtSec = Math.max(0.008, (now - this.lastMoveAt) * 0.001);

          // Natural grab-and-explore sensitivity tuned separately for touch vs desktop
          const isTouch = this.activePointerType === 'touch';
          const sensX = isTouch ? 2.45 / Math.min(width, 640) : 1.9 / width;
          const sensY = isTouch ? 2.35 / Math.min(height, 760) : 1.95 / height;

          const stepX = -dx * sensX;
          const stepY = dy * sensY;

          this.exploreTarget.x = clamp(this.exploreTarget.x + stepX, -1, 1);
          this.exploreTarget.y = clamp(this.exploreTarget.y + stepY, -1, 1);

          const instVx = clamp(stepX / dtSec, -2.6, 2.6);
          const instVy = clamp(stepY / dtSec, -2.6, 2.6);
          this.dragVelocity.x = this.dragVelocity.x * 0.4 + instVx * 0.6;
          this.dragVelocity.y = this.dragVelocity.y * 0.4 + instVy * 0.6;

          this.lastPointerX = e.clientX;
          this.lastPointerY = e.clientY;
          this.lastMoveAt = now;
          this.lastInteractionAt = now;
          return;
        }
      }

      // Detect hover across the 7 major branches and their dimensional portals when not dragging
      if (!this.isDragging && e.pointerType !== 'touch') {
        const matched = this.findDestinationAtPointer(this.pointerNDC);
        this.setHoveredPortal(matched);
      }
    };

    this._onPointerUp = (e) => {
      if (!this.isPointerDown || e.pointerId !== this.activePointerId) return;

      const now = performance.now();
      if (now - this.lastMoveAt > 95) {
        this.dragVelocity.x = 0;
        this.dragVelocity.y = 0;
      }

      if (this.isDragging && this.container.releasePointerCapture) {
        try {
          this.container.releasePointerCapture(e.pointerId);
        } catch {
          // ignore release failure
        }
      }

      this.isPointerDown = false;
      this.isDragging = false;
      this.activePointerId = null;
      this.lastInteractionAt = now;
      this.container.classList.remove('is-dragging');
      this.renderer.domElement.style.cursor = this.hoveredPortal
        ? 'pointer'
        : 'grab';
    };

    this._onPointerLeave = () => {
      if (!this.isDragging) {
        this.cursorTarget.x = 0;
        this.cursorTarget.y = 0;
        this.setHoveredPortal(null);
      }
    };

    this._onWheel = (e) => {
      if (!this.isActive || this.isTransitioning) return;
      e.preventDefault();

      this.hasExplored = true;
      this.lastInteractionAt = performance.now();

      const scale = e.deltaMode === 1 ? 0.045 : 0.0011;
      this.exploreTarget.y = clamp(
        this.exploreTarget.y - e.deltaY * scale,
        -1,
        1
      );
      this.exploreTarget.x = clamp(
        this.exploreTarget.x + e.deltaX * scale,
        -1,
        1
      );
      this.dragVelocity.x = 0;
      this.dragVelocity.y = 0;
    };

    this._onDblClick = (e) => {
      if (!this.isActive || this.isTransitioning) return;
      if (e.target.closest('button, a')) return;

      // Double-clicking open environment smoothly restores default forward view
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      this.pointerNDC.set(
        (e.clientX / width) * 2 - 1,
        -(e.clientY / height) * 2 + 1
      );
      if (this.findDestinationAtPointer(this.pointerNDC)) {
        return;
      }

      this.exploreTarget.x = 0;
      this.exploreTarget.y = 0;
      this.dragVelocity.x = 0;
      this.dragVelocity.y = 0;
      this.hasExplored = false;
    };

    this._onClick = (e) => {
      if (!this.isActive || this.isTransitioning) return;
      if (this.wasDragged) {
        this.wasDragged = false;
        return;
      }

      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      this.pointerNDC.set(
        (e.clientX / width) * 2 - 1,
        -(e.clientY / height) * 2 + 1
      );

      const matched =
        this.findDestinationAtPointer(this.pointerNDC) || this.hoveredPortal;
      if (matched) {
        // Ensure branch activation is visible on mobile first-tap selection
        if (this.hoveredPortal !== matched) {
          this.setHoveredPortal(matched);
        }
        this.branchHoverState.level = Math.max(
          this.branchHoverState.level,
          0.85
        );
        if (this.treeUniforms) {
          this.treeUniforms.uActiveBranchHover.value =
            this.branchHoverState.level;
        }
        this.triggerDimensionalDive(matched);
      }
    };

    this._onTouchMove = (e) => {
      if (!this.isActive) return;
      if (!e.target.closest('button, a')) {
        e.preventDefault();
      }
    };

    this._onResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      if (this.composer) {
        this.composer.setSize(width, height);
      }
      this.updateLayerScales();
    };

    this.container.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove, {
      passive: true,
    });
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerUp);
    this.container.addEventListener('pointerleave', this._onPointerLeave);
    this.container.addEventListener('wheel', this._onWheel, { passive: false });
    this.container.addEventListener('dblclick', this._onDblClick);
    this.container.addEventListener('touchmove', this._onTouchMove, {
      passive: false,
    });
    this.container.addEventListener('click', this._onClick);
    window.addEventListener('resize', this._onResize);
  }

  dispose() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.container.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerUp);
    this.container.removeEventListener('pointerleave', this._onPointerLeave);
    this.container.removeEventListener('wheel', this._onWheel);
    this.container.removeEventListener('dblclick', this._onDblClick);
    this.container.removeEventListener('touchmove', this._onTouchMove);
    this.container.removeEventListener('click', this._onClick);
    window.removeEventListener('resize', this._onResize);
  }

  startLoop() {
    let lastTime = performance.now() * 0.001;
    const clamp = window.THREE.MathUtils.clamp;

    const tick = () => {
      this.rafId = requestAnimationFrame(tick);
      if (!this.isActive || document.hidden) {
        lastTime = performance.now() * 0.001;
        return;
      }

      const nowMs = performance.now();
      const now = nowMs * 0.001;
      const dt = Math.min(0.05, Math.max(0.001, now - lastTime));
      lastTime = now;
      const elapsed = this.clock.getElapsedTime();

      // 1. Update smooth momentum, cursor parallax, camera rig, and depth-tiered layers
      if (!this.isTransitioning) {
        // Apply inertial coast after drag release
        if (!this.isDragging) {
          const speedSq =
            this.dragVelocity.x * this.dragVelocity.x +
            this.dragVelocity.y * this.dragVelocity.y;
          if (speedSq > 0.0001) {
            this.exploreTarget.x = clamp(
              this.exploreTarget.x + this.dragVelocity.x * dt,
              -1,
              1
            );
            this.exploreTarget.y = clamp(
              this.exploreTarget.y + this.dragVelocity.y * dt,
              -1,
              1
            );
            const dragDamp = Math.exp(-dt * 4.4);
            this.dragVelocity.x *= dragDamp;
            this.dragVelocity.y *= dragDamp;
          } else {
            this.dragVelocity.x = 0;
            this.dragVelocity.y = 0;
          }

          // When desktop cursor returns near screen center and visitor is idle,
          // gradually glide explored offset back toward default forward view
          const cursorDist = Math.hypot(
            this.cursorTarget.x,
            this.cursorTarget.y
          );
          if (
            this.hasExplored &&
            !this.isCoarsePointer &&
            !this.hoveredPortal &&
            cursorDist < 0.24 &&
            nowMs - this.lastInteractionAt > 1400
          ) {
            const returnDecay = Math.exp(-dt * 1.15);
            this.exploreTarget.x *= returnDecay;
            this.exploreTarget.y *= returnDecay;
            if (
              Math.abs(this.exploreTarget.x) < 0.004 &&
              Math.abs(this.exploreTarget.y) < 0.004
            ) {
              this.exploreTarget.x = 0;
              this.exploreTarget.y = 0;
              this.hasExplored = false;
            }
          }
        }

        // Exponential frame-rate-independent smoothing (zero GSAP allocations per frame)
        const exploreSmooth = 1 - Math.exp(-dt * (this.isDragging ? 14.0 : 6.2));
        const cursorSmooth = 1 - Math.exp(-dt * 4.6);

        this.exploreCurrent.x +=
          (this.exploreTarget.x - this.exploreCurrent.x) * exploreSmooth;
        this.exploreCurrent.y +=
          (this.exploreTarget.y - this.exploreCurrent.y) * exploreSmooth;
        this.cursorCurrent.x +=
          (this.cursorTarget.x - this.cursorCurrent.x) * cursorSmooth;
        this.cursorCurrent.y +=
          (this.cursorTarget.y - this.cursorCurrent.y) * cursorSmooth;

        const totalX = clamp(
          this.exploreCurrent.x + this.cursorCurrent.x * 0.24,
          -1.08,
          1.08
        );
        const totalY = clamp(
          this.exploreCurrent.y + this.cursorCurrent.y * 0.22,
          -1.08,
          1.08
        );

        const b = this.cameraBounds;
        const floatScale = this.prefersReducedMotion ? 0.0 : 1.0;
        const floatX = Math.sin(elapsed * 0.42) * 0.14 * floatScale;
        const floatY = Math.cos(elapsed * 0.34) * 0.10 * floatScale;

        const maxCamY = totalY >= 0 ? b.camMaxUpY : b.camMaxDownY;
        const maxTiltY = totalY >= 0 ? b.tiltMaxUpY : b.tiltMaxDownY;

        const camX = totalX * b.camMaxX + floatX;
        const camY = totalY * maxCamY + floatY;
        const lookX = camX + totalX * b.tiltMaxX;
        const lookY = camY + totalY * maxTiltY;

        this.camera.position.set(camX, camY, this.baseCameraPos.z);
        this.cameraLookTarget.set(lookX, lookY, -30);
        this.camera.lookAt(this.cameraLookTarget);

        // Depth-tiered subtle counter/relief offsets so far sky is nearly still,
        // distant clouds & canopy glide moderately, and foreground roots anchor smoothly
        if (this.layer1Mesh) {
          this.layer1Mesh.position.x = camX * 0.48;
          this.layer1Mesh.position.y = camY * 0.48;
        }
        if (this.distantCloudsMesh) {
          this.distantCloudsMesh.position.x = camX * 0.24;
          this.distantCloudsMesh.position.y = camY * 0.24;
        }
        if (this.canopyMesh) {
          this.canopyMesh.position.x = -totalX * 0.38;
          this.canopyMesh.position.y = this.canopyBaseY;
        }
        if (this.layer3Mesh) {
          // On upward tilt, foreground root arches sweep downward naturally out of the canopy;
          // on downward tilt, keep foreground roots grounded cleanly around bottom corners
          this.layer3Mesh.position.y = camY < 0 ? camY * 0.34 : 0;
        }
      }

      // 2. Smoothly damp localized branch hover energy & update all 7 dimensional tear portals
      const energyTime = elapsed * (this.prefersReducedMotion ? 0.22 : 1.0);
      const pulsePhase = (energyTime * 0.105) % 1.0;
      const dPulse = pulsePhase - 0.36;
      const treePulse = Math.exp(-(dPulse * dPulse) / 0.0392);

      const hoverRate = this.branchHoverState.target > this.branchHoverState.level ? 6.2 : 3.4;
      const hoverLerp = 1.0 - Math.exp(-dt * hoverRate);
      this.branchHoverState.level +=
        (this.branchHoverState.target - this.branchHoverState.level) * hoverLerp;
      if (this.branchHoverState.level < 0.001 && this.branchHoverState.target === 0) {
        this.branchHoverState.level = 0.0;
      }
      if (this.branchHoverState.level > 0.001) {
        this.branchHoverState.pulseTime += dt * (this.prefersReducedMotion ? 0.35 : 1.0);
      }

      const camOffsetX = this.camera.position.x * 0.42;
      const camOffsetY = this.camera.position.y * 0.42;

      for (let i = 0; i < this.portalNodes.length; i++) {
        const node = this.portalNodes[i];
        node.uniforms.uTime.value = elapsed;
        node.uniforms.uTreePulse.value = treePulse;
        node.uniforms.uCameraOffset.value.set(camOffsetX, camOffsetY);
      }

      // 3. Update atmospheric & World Tree shader time + synchronized pulse & branch hover uniforms
      if (this.treeUniforms) {
        this.treeUniforms.uTime.value = elapsed;
        this.treeUniforms.uTreePulse.value = treePulse;
        this.treeUniforms.uActiveBranchHover.value = this.branchHoverState.level;
        this.treeUniforms.uActiveBranchTime.value = this.branchHoverState.pulseTime;
      }
      if (this.canopyUniforms) {
        this.canopyUniforms.uTime.value = elapsed;
        this.canopyUniforms.uTreePulse.value = treePulse;
      }
      if (this.lowerRootsUniforms) {
        this.lowerRootsUniforms.uTime.value = elapsed;
        this.lowerRootsUniforms.uTreePulse.value = treePulse;
      }
      if (this.distantCloudsUniforms) {
        this.distantCloudsUniforms.uTime.value = elapsed;
        this.distantCloudsUniforms.uTreePulse.value = treePulse;
      }
      if (this.abyssMistUniforms) {
        this.abyssMistUniforms.uTime.value = elapsed;
        this.abyssMistUniforms.uTreePulse.value = treePulse;
      }
      if (this.fgMistUniforms) {
        this.fgMistUniforms.uTime.value = elapsed;
        this.fgMistUniforms.uTreePulse.value = treePulse;
      }
      if (this.particleUniforms) {
        this.particleUniforms.uTime.value = elapsed;
        this.particleUniforms.uTreePulse.value = treePulse;
        this.particleUniforms.uActiveBranchHover.value =
          this.branchHoverState.level;
      }

      // 4. Keep the hovered destination HTML label locked cleanly above the dimensional tear
      if (this.hoveredPortal && !this.isTransitioning) {
        this.updateHoveredLabelPosition();
      }

      // 5. Render directly during idle exploration for mobile performance;
      //    route through EffectComposer only during active screen-tear transitions
      if (this.tearPass) {
        this.tearPass.uniforms.uTime.value = elapsed;
      }
      const tearActive =
        this.isTransitioning ||
        (this.tearPass && this.tearPass.uniforms.uDistortion.value > 0.001);
      if (tearActive) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }
}

/* -------------------------------------------------------------------------- */
/* 6. GATEWAY DOM INITIALIZATION, HOVER LABEL & "RETURN TO NEXUS" BUTTON      */
/* -------------------------------------------------------------------------- */
function injectGatewayStyles() {
  if (document.getElementById('gateway-vortex-styles')) return;
  const style = document.createElement('style');
  style.id = 'gateway-vortex-styles';
  style.textContent = `
    #multiverse-gateway {
      transition: opacity 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .gateway-diving .gateway-header,
    .gateway-diving .gateway-look-hud,
    .gateway-diving .gateway-portal-label {
      opacity: 0 !important;
      pointer-events: none !important;
      transition: opacity 0.22s ease-out !important;
    }

    /* Phase 4: Elegant, Restrained Architectural Universe Destination Label */
    .gateway-portal-label {
      position: fixed;
      left: 0;
      top: 0;
      z-index: 15;
      pointer-events: none;
      opacity: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      padding: 8px 16px 9px 15px;
      border-radius: 3px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-left: 2px solid var(--portal-color, #42d9ff);
      background: linear-gradient(135deg, rgba(4, 10, 22, 0.86) 0%, rgba(2, 6, 15, 0.72) 100%);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #f8fafc;
      white-space: nowrap;
      box-shadow:
        0 12px 32px rgba(0, 0, 0, 0.68),
        0 0 24px color-mix(in srgb, var(--portal-color, #42d9ff) 28%, transparent);
      transition: opacity 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
      will-change: transform, opacity;
    }
    .gateway-portal-label-meta {
      font: 600 9.5px/1.15 'Rajdhani', sans-serif;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: var(--portal-secondary, #bae6fd);
      opacity: 0.88;
    }
    .gateway-portal-label-title {
      font: 700 12.5px/1.2 'Orbitron', sans-serif;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #ffffff;
      text-shadow: 0 0 14px color-mix(in srgb, var(--portal-color, #42d9ff) 55%, transparent);
    }
    .gateway-portal-label.is-visible {
      opacity: 1;
    }

    /* Phase 4: Global "RETURN TO NEXUS" Button */
    #return-to-nexus {
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 999px;
      border: 1px solid rgba(66, 217, 255, 0.45);
      background: rgba(4, 11, 22, 0.82);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      color: #e8f7ff;
      font: 700 10px 'Orbitron', sans-serif;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      cursor: pointer;
      box-shadow: 0 10px 32px rgba(0, 0, 0, 0.6), 0 0 18px rgba(66, 217, 255, 0.22);
      transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease;
    }
    #return-to-nexus::before {
      content: '←';
      color: var(--accent, #42d9ff);
      font-size: 13px;
      line-height: 1;
    }
    #return-to-nexus:hover {
      border-color: var(--accent, #42d9ff);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.78), 0 0 26px rgba(66, 217, 255, 0.48);
      transform: translateY(-2px);
    }
    #return-to-nexus:active {
      transform: scale(0.97);
    }
  `;
  document.head.appendChild(style);
}

function initMultiverseGateway() {
  document.body.classList.add('gateway-active');
  injectGatewayStyles();

  // Create Gateway Section Container
  const gatewayRoot = document.createElement('section');
  gatewayRoot.id = 'multiverse-gateway';
  gatewayRoot.setAttribute(
    'aria-label',
    "Visionexa '26 — Multiverse 404 World Tree Gateway"
  );

  const vignette = document.createElement('div');
  vignette.className = 'gateway-vignette';
  vignette.setAttribute('aria-hidden', 'true');

  const header = document.createElement('header');
  header.className = 'gateway-header';
  header.setAttribute('data-gateway-ui', 'true');
  header.innerHTML = `
    <h1 class="gateway-brand-title">VISIONEXA <span>'26</span></h1>
    <div class="gateway-subtitle-prompt">MULTIVERSE 404 // SELECT A REALITY PORTAL</div>
  `;

  // Minimal floating HTML UI label revealed when hovering one of the 7 spinning portals
  const portalLabel = document.createElement('div');
  portalLabel.className = 'gateway-portal-label';
  portalLabel.setAttribute('role', 'status');
  portalLabel.setAttribute('aria-live', 'polite');

  const lookHud = document.createElement('div');
  lookHud.className = 'gateway-look-hud';
  lookHud.setAttribute('data-gateway-ui', 'true');
  lookHud.innerHTML = `
    <div class="gateway-look-hint">DRAG OR SCROLL TO EXPLORE &nbsp;·&nbsp; MOVE CURSOR FOR DEPTH &nbsp;·&nbsp; CLICK A PORTAL</div>
  `;

  gatewayRoot.appendChild(vignette);
  gatewayRoot.appendChild(header);
  gatewayRoot.appendChild(portalLabel);
  gatewayRoot.appendChild(lookHud);
  document.body.appendChild(gatewayRoot);

  // Phase 4: Dynamically create `<button id="return-to-nexus" style="position:fixed; top:20px; left:20px; z-index:9999; display:none;">RETURN TO NEXUS</button>`
  let returnBtn = document.getElementById('return-to-nexus');
  if (!returnBtn) {
    returnBtn = document.createElement('button');
    returnBtn.id = 'return-to-nexus';
    returnBtn.type = 'button';
    returnBtn.setAttribute(
      'style',
      'position:fixed; top:20px; left:20px; z-index:9999; display:none; opacity:0;'
    );
    returnBtn.textContent = 'RETURN TO NEXUS';
    document.body.appendChild(returnBtn);
  }

  const gatewayInstance = new MultiverseGateway({
    container: gatewayRoot,
    labelEl: portalLabel,
    returnBtn,
  });

  window.VisionexaGateway = gatewayInstance;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMultiverseGateway);
} else {
  initMultiverseGateway();
}
