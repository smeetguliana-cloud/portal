// Visionexa '26 — Custom GLSL Shaders for the Infinite Cosmic Tree Environment

export const INFINITE_VOID_DOME_SHADER = {
  vertexShader: `
    varying vec3 vWorldDir;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldDir = normalize(worldPos.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec3 vWorldDir;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = rot * p * 2.02 + vec2(11.3, 7.9);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 p = vWorldDir.xy * 2.8;
      float t = uTime * 0.015;
      float n1 = fbm(p + vec2(t, -t * 0.4));
      float n2 = fbm(p * 1.8 - vec2(t * 0.5, t * 0.3) + n1 * 0.7);

      // Deep cosmic storm-cloud slate, midnight indigo, and warm/cool distant energy glow
      vec3 deepVoid = vec3(0.025, 0.032, 0.055);
      vec3 stormCloud = vec3(0.075, 0.088, 0.135);
      vec3 warmMist = vec3(0.22, 0.17, 0.12);
      vec3 cyanMist = vec3(0.06, 0.16, 0.20);

      float cloudFactor = smoothstep(0.28, 0.82, n1 * 0.55 + n2 * 0.55);
      vec3 col = mix(deepVoid, stormCloud, cloudFactor);
      col += warmMist * smoothstep(0.55, 0.92, n2) * 0.35;
      col += cyanMist * smoothstep(0.5, 0.88, n1) * 0.32;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export const COSMIC_TREE_DEPTH_SHADER = {
  vertexShader: `
    uniform sampler2D uMap;
    uniform float uHasMap;
    uniform float uTime;
    uniform float uCurveRadius;
    uniform float uDispHeight;
    uniform vec2 uUvScale;
    uniform vec2 uUvOffset;
    uniform float uMirrorRepeat;

    varying vec2 vRawUv;
    varying vec2 vSampleUv;
    varying float vElevation;

    vec2 computeSampleUv(vec2 rawUv) {
      vec2 centered = (rawUv - 0.5) * uUvScale + 0.5 + uUvOffset;
      if (uMirrorRepeat > 0.5) {
        // Triangle-wave mirror repeat so peripheral/overhead/abyssal planes tile seamlessly without hard seams
        vec2 m = mod(centered, 2.0);
        m = mix(m, 2.0 - m, step(1.0, m));
        return clamp(m, 0.01, 0.99);
      }
      return clamp(centered, 0.005, 0.995);
    }

    void main() {
      vRawUv = uv;
      vSampleUv = computeSampleUv(uv);

      vec3 pos = position;

      // Wrap plane into an enveloping 3D curved amphitheater shell around the viewer
      float bendZ = (pos.x * pos.x) / (2.0 * uCurveRadius) + (pos.y * pos.y) / (2.5 * uCurveRadius);
      pos.z += bendZ;

      // Luminance-driven 3D relief displacement: bright energy strands extrude forward toward viewer
      float luma = 0.35;
      if (uHasMap > 0.5) {
        vec4 tex = texture2D(uMap, vSampleUv);
        luma = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
      }

      // Subtle living breath along the strands
      float breath = sin(pos.x * 0.25 + pos.y * 0.3 + uTime * 0.55) * 0.14;
      float disp = (luma - 0.28) * uDispHeight + breath * smoothstep(0.3, 0.8, luma);
      pos.z += disp;
      vElevation = luma;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uMap;
    uniform float uHasMap;
    uniform float uTime;
    uniform float uLumaMin;
    uniform float uLumaMax;
    uniform float uOpacity;
    uniform vec3 uTint;
    uniform float uFlowSpeed;
    uniform float uEdgeVignetteHole;

    varying vec2 vRawUv;
    varying vec2 vSampleUv;
    varying float vElevation;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    void main() {
      if (uHasMap < 0.5) discard;

      // Subtle animated micro-refraction along the energy strands
      float t = uTime * uFlowSpeed;
      float nFlow = noise(vSampleUv * 14.0 + vec2(t * 0.35, t * 0.22));
      float nFlow2 = noise(vSampleUv * 28.0 - vec2(t * 0.55, -t * 0.4));

      vec4 baseTex = texture2D(uMap, vSampleUv);
      float luma = dot(baseTex.rgb, vec3(0.299, 0.587, 0.114));

      // Slight living shimmer UV warp concentrated on luminous strands
      float strandMask = smoothstep(0.34, 0.78, luma);
      vec2 warpOffset = vec2(nFlow - 0.5, nFlow2 - 0.5) * 0.0028 * strandMask;
      vec3 col = texture2D(uMap, clamp(vSampleUv + warpOffset, 0.005, 0.995)).rgb;

      // Depth-layer luminance slicing (allows foreground shells to isolate only bright energy strands)
      float sliceAlpha = smoothstep(uLumaMin, uLumaMin + 0.18, luma);

      // Animated travelling energy pulses flowing along the intertwined golden/cyan strands
      float pulseWave = sin(vSampleUv.x * 18.0 + vSampleUv.y * 14.0 - t * 1.6 + nFlow * 4.5);
      float pulseGlow = pow(0.5 + 0.5 * pulseWave, 3.5) * strandMask;

      // Warm golden-white & ethereal cyan energy boost on active strand pulses
      vec3 pulseColor = mix(vec3(0.45, 0.92, 0.95), vec3(1.0, 0.92, 0.68), smoothstep(0.45, 0.85, baseTex.r));
      col = col * uTint + pulseColor * pulseGlow * 0.34;

      // Smooth peripheral feathering so planes blend seamlessly into the infinite cloudscape
      vec2 edgeDist = min(vRawUv, 1.0 - vRawUv);
      float edgeFade = smoothstep(0.0, 0.16, edgeDist.x) * smoothstep(0.0, 0.18, edgeDist.y);

      // Optional center window cutout for near-camera foreground framing layer
      if (uEdgeVignetteHole > 0.5) {
        float centerDist = length((vRawUv - 0.5) * vec2(1.4, 1.6));
        edgeFade *= smoothstep(0.22, 0.58, centerDist);
      }

      float finalAlpha = sliceAlpha * edgeFade * uOpacity;
      if (finalAlpha < 0.01) discard;

      gl_FragColor = vec4(col, finalAlpha);
    }
  `,
};

export const VOLUMETRIC_CLOUD_SHADER = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uCloudColor;
    uniform vec3 uRimColor;
    uniform float uSeed;
    uniform float uOpacity;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = p * 2.03 + vec2(7.1, 13.4);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 p = (vUv - 0.5) * 2.0;
      float r = length(p);
      if (r > 1.0) discard;

      float radialMask = pow(1.0 - r, 1.65);
      float t = uTime * 0.04;
      float billow = fbm(p * 2.2 + vec2(uSeed + t, uSeed * 0.7 - t * 0.6));
      float cloudDensity = smoothstep(0.24, 0.84, billow * radialMask * 1.45);

      // Internal golden/cyan silver-lining illumination near cloud ridges
      float rimLight = smoothstep(0.32, 0.68, billow) * (1.0 - smoothstep(0.68, 0.92, billow));
      vec3 col = mix(uCloudColor, uRimColor, rimLight * 0.65);

      gl_FragColor = vec4(col, cloudDensity * uOpacity);
    }
  `,
};

export const LIVING_FILAMENT_SHADER = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPos;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      vViewPos = -mvPos.xyz;
      gl_Position = projectionMatrix * mvPos;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uSpeed;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPos;

    void main() {
      vec3 viewDir = normalize(vViewPos);
      float core = pow(abs(dot(viewDir, vNormal)), 0.75);

      float wave1 = 0.5 + 0.5 * sin(vUv.x * 16.0 - uTime * uSpeed * 2.2 + vUv.y * 6.28318);
      float surge = pow(0.5 + 0.5 * sin(vUv.x * 6.0 - uTime * uSpeed * 1.4), 3.0);

      vec3 col = mix(uColorB, uColorA, wave1 * 0.7 + surge * 0.4);
      col = mix(col, vec3(1.0, 0.98, 0.9), surge * 0.45);

      float endFade = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
      float alpha = core * (0.22 + wave1 * 0.35 + surge * 0.38) * endFade * 0.72;

      gl_FragColor = vec4(col, alpha);
    }
  `,
};

export const PARTICLE_STREAM_SHADER = {
  vertexShader: `
    attribute float aSize;
    attribute vec3 aColor;
    attribute float aAlpha;
    varying vec3 vColor;
    varying float vAlpha;
    uniform float uPixelRatio;

    void main() {
      vColor = aColor;
      vAlpha = aAlpha;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * uPixelRatio * (110.0 / max(-mvPosition.z, 1.0));
      gl_PointSize = clamp(gl_PointSize, 1.2, 22.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv) * 2.0;
      if (d > 1.0) discard;
      float glow = pow(1.0 - d, 2.4);
      vec3 col = mix(vColor, vec3(1.0, 0.98, 0.92), pow(1.0 - d, 4.0) * 0.55);
      gl_FragColor = vec4(col, glow * vAlpha);
    }
  `,
};
