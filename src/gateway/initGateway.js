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
/* 3. SEVEN UNIVERSE PORTAL DEFINITIONS (PHASE 2)                             */
/*    Placed at z = -29.9 directly on the branches of Layer 2 (z = -30).      */
/* -------------------------------------------------------------------------- */
const UNIVERSE_PORTALS = [
  {
    id: 'techverse',
    sector: 'SECTOR 01',
    title: 'TECHVERSE',
    label: 'SECTOR 01 // TECHVERSE',
    color: '#42d9ff',
    nx: -0.25,
    ny: 0.21,
  },
  {
    id: 'gameverse',
    sector: 'SECTOR 02',
    title: 'GAMEVERSE',
    label: 'SECTOR 02 // GAMEVERSE',
    color: '#c084fc',
    nx: -0.34,
    ny: 0.03,
  },
  {
    id: 'vibeverse',
    sector: 'SECTOR 03',
    title: 'VIBEVERSE',
    label: 'SECTOR 03 // VIBEVERSE',
    color: '#f472b6',
    nx: -0.19,
    ny: -0.09,
  },
  {
    id: 'aiverse',
    sector: 'SECTOR 04',
    title: 'AIVERSE',
    label: 'SECTOR 04 // AIVERSE',
    color: '#a5a6ff',
    nx: 0.0,
    ny: 0.29,
  },
  {
    id: 'cyberverse',
    sector: 'SECTOR 05',
    title: 'CYBERVERSE',
    label: 'SECTOR 05 // CYBERVERSE',
    color: '#fb923c',
    nx: 0.25,
    ny: 0.21,
  },
  {
    id: 'humanverse',
    sector: 'SECTOR 06',
    title: 'HUMANVERSE',
    label: 'SECTOR 06 // HUMANVERSE',
    color: '#7dd3c7',
    nx: 0.34,
    ny: 0.02,
  },
  {
    id: 'futureverse',
    sector: 'SECTOR 07',
    title: 'FUTUREVERSE',
    label: 'SECTOR 07 // FUTUREVERSE',
    color: '#fbbf64',
    nx: 0.20,
    ny: -0.10,
  },
];

/* -------------------------------------------------------------------------- */
/* 4. CUSTOM GLSL SHADERS FOR PARALLAX LAYERS & SCREEN-TEAR POST-PROCESSING   */
/* -------------------------------------------------------------------------- */

/**
 * WORLD TREE SHADER (Layer 2: '/assets/layer2_tree.png' @ z = -30)
 * - Combines `uBaseTexture` ('/assets/layer2_tree.png') with `uEmissiveMask`
 *   ('/assets/layer4_emissive.jpg' / '.png') so the tree's veins pulse with
 *   flowing cyan/gold energy beneath the 7 spinning vortex portals.
 * - Cleans green-screen spill around semi-transparent branch edges.
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
    uniform float uSpeed;
    uniform float uFrequency;
    uniform float uGlowIntensity;

    varying vec2 vUv;

    void main() {
      if (uHasBase < 0.5) discard;

      vec4 baseTex = texture2D(uBaseTexture, vUv);

      // Clean green-screen chroma spill on semi-transparent branch edges
      float maxRB = max(baseTex.r, baseTex.b);
      float greenExcess = max(0.0, baseTex.g - maxRB);
      float chromaKeyMask = smoothstep(0.06, 0.32, greenExcess);
      vec3 treeColor = baseTex.rgb;
      treeColor.g = mix(baseTex.g, maxRB * 0.92, smoothstep(0.015, 0.14, greenExcess));

      float alpha = baseTex.a * (1.0 - chromaKeyMask * 0.96);
      if (alpha < 0.02) discard;

      // Add subtle pulsing cyan/gold energy along the World Tree's veins
      if (uHasMask > 0.5) {
        float maskVal = texture2D(uEmissiveMask, vUv).r;
        if (maskVal > 0.01) {
          float upwardPulse = 0.5 + 0.5 * sin(uTime * uSpeed - vUv.y * uFrequency);
          vec3 cyanGlow = vec3(0.26, 0.88, 1.0);
          vec3 goldGlow = vec3(1.0, 0.80, 0.32);
          float colorMix = 0.5 + 0.5 * sin(vUv.y * 5.0 - uTime * 0.8 + vUv.x * 2.5);
          vec3 veinColor = mix(cyanGlow, goldGlow, colorMix);

          treeColor += veinColor * maskVal * (0.35 + 0.95 * upwardPulse) * uGlowIntensity;
        }
      }

      gl_FragColor = vec4(treeColor, alpha);
    }
  `,
};

/**
 * FOREGROUND ROOTS SHADER (Layer 3: '/assets/layer3_fg.png' @ z = -10)
 * Renders the foreground root arches and lower ground roots at z = -10 while
 * keeping the central canopy opening clear so Layer 2's World Tree and the
 * 7 spinning portals at z = -29.9 remain crisp and unobstructed.
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

      // Clean green-screen fringe
      float maxRB = max(tex.r, tex.b);
      float greenExcess = max(0.0, tex.g - maxRB);
      float chromaCut = smoothstep(0.05, 0.28, greenExcess);
      vec3 col = tex.rgb;
      col.g = mix(tex.g, maxRB * 0.9, smoothstep(0.015, 0.14, greenExcess));

      // Preserve the outer left/right root pillars and lower ground roots while
      // feathering open the central tree crown window
      vec2 centerEllip = (vUv - vec2(0.5, 0.58)) / vec2(0.35, 0.44);
      float outerArchMask = smoothstep(0.58, 1.05, length(centerEllip));
      float bottomRootsMask = 1.0 - smoothstep(0.14, 0.32, vUv.y);
      float fgMask = max(outerArchMask, bottomRootsMask);

      float alpha = tex.a * (1.0 - chromaCut) * fgMask;
      if (alpha < 0.02) discard;

      gl_FragColor = vec4(col * 0.88, alpha);
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

    // Base camera coordinates & parallax state
    this.baseFov = 50;
    this.baseCameraPos = new THREE.Vector3(0, 0, 0);
    this.parallaxTarget = { x: 0, y: 0 };
    this.cameraLookTarget = new THREE.Vector3(0, 0, -30);

    // Raycaster & 7 spinning portal nodes state
    this.raycaster = new THREE.Raycaster();
    this.pointerNDC = new THREE.Vector2(-999, -999);
    this.portalNodes = [];
    this.hoveredPortal = null;
    this.treeGlowState = { intensity: 1.0 };

    this.clock = new THREE.Clock();
    this.rafId = 0;

    this.initScene();
    this.buildParallaxLayers();
    this.buildUniversePortals();
    this.initPostProcessing();
    this.setupReturnToNexusHook();
    this.bindEvents();
    this.startLoop();
  }

  /**
   * Smart texture loader that resolves both .jpg and .png extensions
   * so '/assets/layer1_bg.jpg' / '.png' and '/assets/portal_vortex.jpg' / '.png'
   * load cleanly without 404 errors.
   */
  loadTextureWithFallback(requestedPath, onLoad) {
    const THREE = window.THREE;
    const loader = new THREE.TextureLoader();

    const candidates = [];
    if (requestedPath.endsWith('.jpg')) {
      candidates.push(requestedPath.replace(/\.jpg$/i, '.png'), requestedPath);
    } else if (requestedPath.endsWith('.png')) {
      candidates.push(requestedPath, requestedPath.replace(/\.png$/i, '.jpg'));
    } else {
      candidates.push(requestedPath);
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
   * Phase 1: Creates the three flat THREE.PlaneGeometry layers spaced along the Z-axis:
   * - Layer 1 (Nebula Background): '/assets/layer1_bg.jpg' at z = -60
   * - Layer 2 (The Tree):          '/assets/layer2_tree.png' at z = -30
   * - Layer 3 (Foreground Roots):  '/assets/layer3_fg.png' at z = -10
   */
  buildParallaxLayers() {
    const THREE = window.THREE;
    const planeGeo = new THREE.PlaneGeometry(1, 1);

    // --- LAYER 1: Nebula Background at z = -60 ---
    this.layer1Material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      depthWrite: false,
    });
    this.layer1Mesh = new THREE.Mesh(planeGeo, this.layer1Material);
    this.layer1Mesh.position.set(0, 0, -60);
    this.layer1Mesh.renderOrder = 1;
    this.scene.add(this.layer1Mesh);

    this.loadTextureWithFallback('/assets/layer1_bg.jpg', (tex) => {
      this.layer1Material.map = tex;
      this.layer1Material.needsUpdate = true;
    });

    // --- LAYER 2: The World Tree at z = -30 ---
    this.treeUniforms = {
      uBaseTexture: { value: null },
      uEmissiveMask: { value: null },
      uHasBase: { value: 0.0 },
      uHasMask: { value: 0.0 },
      uTime: { value: 0.0 },
      uSpeed: { value: 2.6 },
      uFrequency: { value: 10.0 },
      uGlowIntensity: { value: 1.0 },
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
    this.layer2Mesh.renderOrder = 2;
    this.scene.add(this.layer2Mesh);

    this.loadTextureWithFallback('/assets/layer2_tree.png', (tex) => {
      this.treeUniforms.uBaseTexture.value = tex;
      this.treeUniforms.uHasBase.value = 1.0;
    });

    this.loadTextureWithFallback('/assets/layer4_emissive.jpg', (maskTex) => {
      if (THREE.LinearEncoding) {
        maskTex.encoding = THREE.LinearEncoding;
      }
      this.treeUniforms.uEmissiveMask.value = maskTex;
      this.treeUniforms.uHasMask.value = 1.0;
    });

    // --- LAYER 3: Foreground Roots at z = -10 ---
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
    this.layer3Mesh.renderOrder = 4;
    this.scene.add(this.layer3Mesh);

    this.loadTextureWithFallback('/assets/layer3_fg.png', (tex) => {
      this.layer3Uniforms.uTexture.value = tex;
      this.layer3Uniforms.uHasTexture.value = 1.0;
    });

    this.updateLayerScales();
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

    const d1 = this.getDimensionsAtZ(-60, 1.28);
    this.layer1Mesh.scale.set(d1.width, d1.height, 1);

    const d2 = this.getDimensionsAtZ(-30, 1.16);
    this.layer2Mesh.scale.set(d2.width, d2.height, 1);
    this.treeDimensions = d2;

    const d3 = this.getDimensionsAtZ(-10, 1.26);
    this.layer3Mesh.scale.set(d3.width, d3.height, 1);

    this.updatePortalPositions();
  }

  /**
   * Phase 2: Creates the 7 visible Universe Portals at z = -29.9 on the Tree branches.
   * - Uses THREE.PlaneGeometry and THREE.MeshBasicMaterial with '/assets/portal_vortex.jpg'
   *   as `map`, `transparent: true`, `depthWrite: false`, and `blending: THREE.AdditiveBlending`.
   * - Calls `material.color.set(cfg.color)` to tint each portal with its universe brand color.
   */
  buildUniversePortals() {
    const THREE = window.THREE;
    const portalGeo = new THREE.PlaneGeometry(1, 1);

    UNIVERSE_PORTALS.forEach((cfg, idx) => {
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      // Tint each portal with its specific universe brand color
      material.color.set(cfg.color);

      const mesh = new THREE.Mesh(portalGeo, material);
      mesh.position.set(0, 0, -29.9);
      mesh.rotation.z = idx * 0.9; // Stagger initial Z rotation angle
      mesh.renderOrder = 3;
      mesh.userData = { ...cfg };
      this.scene.add(mesh);

      this.portalNodes.push({
        cfg,
        mesh,
        material,
        baseScale: 5.0,
        animState: {
          scaleFactor: 1.0,
          spinSpeed: 0.65 + (idx % 3) * 0.12, // Continuous slow Z-axis spin speed (rad/s)
          opacity: 0.92,
        },
      });
    });

    // Load '/assets/portal_vortex.jpg' (resolving '/assets/portal_vortex.png') and assign as `map`
    this.loadTextureWithFallback('/assets/portal_vortex.jpg', (rawTex) => {
      const vortexTex = this.createCircularMaskedVortexTexture(rawTex);
      this.portalNodes.forEach((node) => {
        node.material.map = vortexTex;
        node.material.needsUpdate = true;
      });
    });

    this.updatePortalPositions();
  }

  /**
   * Positions and scales the 7 portal planes at z = -29.9 on the World Tree branches
   * across desktop and mobile viewports.
   */
  updatePortalPositions() {
    if (!this.portalNodes || !this.portalNodes.length || !this.treeDimensions) {
      return;
    }

    const { width, height, frustumWidth, frustumHeight } = this.treeDimensions;
    const spanX = Math.min(width * 0.88, frustumWidth * 0.86);
    const spanY = Math.min(height * 0.88, frustumHeight * 0.82);
    const baseSize = Math.max(4.0, Math.min(6.2, frustumWidth * 0.125));

    this.portalNodes.forEach((node) => {
      node.baseScale = baseSize;
      const wx = node.cfg.nx * spanX;
      const wy = node.cfg.ny * spanY;
      node.mesh.position.set(wx, wy, -29.9);
      const s = node.baseScale * node.animState.scaleFactor;
      node.mesh.scale.set(s, s, 1);
    });
  }

  /**
   * Phase 2: Handles Raycaster hover on any of the 7 spinning vortex portals:
   * - Uses GSAP to scale the portal up slightly, make it spin faster, and fade in
   *   the minimal HTML UI label (e.g., "SECTOR 01 // TECHVERSE") over the portal.
   */
  setHoveredPortal(targetNode) {
    if (this.hoveredPortal === targetNode) return;

    // Reset previously hovered portal
    if (this.hoveredPortal) {
      const prev = this.hoveredPortal;
      gsap.to(prev.animState, {
        scaleFactor: 1.0,
        spinSpeed: 0.7,
        opacity: 0.92,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: () => {
          const s = prev.baseScale * prev.animState.scaleFactor;
          prev.mesh.scale.set(s, s, 1);
          prev.material.opacity = prev.animState.opacity;
        },
      });
    }

    this.hoveredPortal = targetNode;

    if (targetNode) {
      this.renderer.domElement.style.cursor = 'pointer';

      // Scale portal up slightly and make it spin faster on Z-axis
      gsap.to(targetNode.animState, {
        scaleFactor: 1.34,
        spinSpeed: 2.85,
        opacity: 1.0,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: () => {
          const s = targetNode.baseScale * targetNode.animState.scaleFactor;
          targetNode.mesh.scale.set(s, s, 1);
          targetNode.material.opacity = targetNode.animState.opacity;
        },
      });

      // Boost World Tree vein pulse subtly while a portal is hovered
      gsap.to(this.treeGlowState, {
        intensity: 1.65,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: () => {
          this.treeUniforms.uGlowIntensity.value = this.treeGlowState.intensity;
        },
      });

      // Fade in the minimal HTML UI label positioned over the hovered portal
      if (this.labelEl) {
        this.labelEl.textContent = targetNode.cfg.label;
        this.labelEl.style.setProperty('--portal-color', targetNode.cfg.color);
        this.labelEl.classList.add('is-visible');
        this.updateHoveredLabelPosition();
      }
    } else {
      this.renderer.domElement.style.cursor = 'default';

      gsap.to(this.treeGlowState, {
        intensity: 1.0,
        duration: 0.4,
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
   * Projects the hovered portal's 3D coordinates onto 2D screen space so the
   * minimal HTML label stays positioned cleanly above the spinning vortex.
   */
  updateHoveredLabelPosition() {
    if (!this.hoveredPortal || !this.labelEl) return;
    const THREE = window.THREE;
    const tempVec = new THREE.Vector3();
    tempVec.copy(this.hoveredPortal.mesh.position);
    tempVec.project(this.camera);

    const x = (tempVec.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-tempVec.y * 0.5 + 0.5) * window.innerHeight;
    const offsetPx = Math.max(36, Math.min(58, window.innerWidth * 0.042));
    this.labelEl.style.transform = `translate3d(${x.toFixed(1)}px, ${(y - offsetPx).toFixed(1)}px, 0) translate(-50%, -100%)`;
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

    // Accelerate & expand the clicked vortex portal as the camera dives into it
    gsap.to(portalNode.animState, {
      scaleFactor: 2.6,
      spinSpeed: 7.5,
      opacity: 1.0,
      duration: 1.05,
      ease: 'expo.in',
      overwrite: true,
      onUpdate: () => {
        const s = portalNode.baseScale * portalNode.animState.scaleFactor;
        portalNode.mesh.scale.set(s, s, 1);
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

    // Reset all portal scales and spin speeds to normal
    this.portalNodes.forEach((node) => {
      node.animState.scaleFactor = 1.0;
      node.animState.spinSpeed = 0.7;
      node.animState.opacity = 0.92;
      const s = node.baseScale;
      node.mesh.scale.set(s, s, 1);
      node.material.opacity = 0.92;
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

    this.parallaxTarget.x = 0;
    this.parallaxTarget.y = 0;

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
   * Binds pointer movement (for 2.5D camera parallax and portal raycasting),
   * click handling for portal dive, and responsive window resize.
   */
  bindEvents() {
    this._onPointerMove = (e) => {
      if (!this.isActive || this.isTransitioning) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const nx = (e.clientX / width) * 2 - 1;
      const ny = -(e.clientY / height) * 2 + 1;

      this.pointerNDC.set(nx, ny);

      // Phase 1: Shift camera X and Y via GSAP to create deep 2.5D parallax
      gsap.to(this.parallaxTarget, {
        x: nx * 2.4,
        y: ny * 1.45,
        duration: 0.85,
        ease: 'power2.out',
        overwrite: true,
      });

      // Phase 2: Raycast against the 7 portal planes for hover feedback
      this.raycaster.setFromCamera(this.pointerNDC, this.camera);
      const portalMeshes = this.portalNodes.map((n) => n.mesh);
      const hits = this.raycaster.intersectObjects(portalMeshes, false);

      if (hits.length > 0) {
        const hitMesh = hits[0].object;
        const matched = this.portalNodes.find((n) => n.mesh === hitMesh);
        this.setHoveredPortal(matched || null);
      } else {
        this.setHoveredPortal(null);
      }
    };

    this._onClick = (e) => {
      if (!this.isActive || this.isTransitioning) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      this.pointerNDC.set(
        (e.clientX / width) * 2 - 1,
        -(e.clientY / height) * 2 + 1
      );

      this.raycaster.setFromCamera(this.pointerNDC, this.camera);
      const portalMeshes = this.portalNodes.map((n) => n.mesh);
      const hits = this.raycaster.intersectObjects(portalMeshes, false);

      if (hits.length > 0) {
        const hitMesh = hits[0].object;
        const matched = this.portalNodes.find((n) => n.mesh === hitMesh);
        if (matched) {
          this.triggerDimensionalDive(matched);
        }
      } else if (this.hoveredPortal) {
        this.triggerDimensionalDive(this.hoveredPortal);
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

    window.addEventListener('pointermove', this._onPointerMove, {
      passive: true,
    });
    this.container.addEventListener('click', this._onClick);
    window.addEventListener('resize', this._onResize);
  }

  startLoop() {
    let lastTime = performance.now() * 0.001;

    const tick = () => {
      this.rafId = requestAnimationFrame(tick);
      if (!this.isActive || document.hidden) {
        lastTime = performance.now() * 0.001;
        return;
      }

      const now = performance.now() * 0.001;
      const dt = Math.min(0.05, Math.max(0.001, now - lastTime));
      lastTime = now;
      const elapsed = this.clock.getElapsedTime();

      // 1. Update camera X/Y parallax when not diving/returning
      if (!this.isTransitioning) {
        const floatX = Math.sin(elapsed * 0.42) * 0.16;
        const floatY = Math.cos(elapsed * 0.34) * 0.11;

        this.camera.position.x = this.parallaxTarget.x + floatX;
        this.camera.position.y = this.parallaxTarget.y + floatY;
        this.camera.position.z = this.baseCameraPos.z;

        this.cameraLookTarget.set(
          this.camera.position.x * 0.35,
          this.camera.position.y * 0.35,
          -30
        );
        this.camera.lookAt(this.cameraLookTarget);
      }

      // 2. Continuously rotate all 7 portals on their Z-axis to look like spinning vortexes
      for (let i = 0; i < this.portalNodes.length; i++) {
        const node = this.portalNodes[i];
        node.mesh.rotation.z -= dt * node.animState.spinSpeed;
      }

      // 3. Update Layer 2 World Tree Flowing Energy Shader time uniform
      if (this.treeUniforms) {
        this.treeUniforms.uTime.value = elapsed;
      }

      // 4. Keep the hovered portal HTML UI label locked above the spinning vortex
      if (this.hoveredPortal && !this.isTransitioning) {
        this.updateHoveredLabelPosition();
      }

      // 5. Update Screen-Tear Post-Processing time uniform & render via EffectComposer
      if (this.tearPass) {
        this.tearPass.uniforms.uTime.value = elapsed;
      }

      this.composer.render();
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

    /* Minimal HTML UI Label faded in over hovered spinning portal */
    .gateway-portal-label {
      position: fixed;
      left: 0;
      top: 0;
      z-index: 15;
      pointer-events: none;
      opacity: 0;
      padding: 8px 16px;
      border-radius: 999px;
      border: 1px solid var(--portal-color, #42d9ff);
      background: rgba(3, 9, 20, 0.84);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #f4f8ff;
      font: 700 11px 'Orbitron', sans-serif;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      white-space: nowrap;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.65), 0 0 22px color-mix(in srgb, var(--portal-color, #42d9ff) 45%, transparent);
      transition: opacity 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
      will-change: transform, opacity;
    }
    .gateway-portal-label::before {
      content: '';
      display: inline-block;
      width: 7px;
      height: 7px;
      margin-right: 10px;
      border-radius: 50%;
      background: var(--portal-color, #42d9ff);
      box-shadow: 0 0 12px var(--portal-color, #42d9ff);
      vertical-align: middle;
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
    <div class="gateway-look-hint">MOVE CURSOR FOR 3D PARALLAX &nbsp;·&nbsp; CLICK A VORTEX PORTAL TO DIVE IN</div>
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
