// Visionexa '26 — Custom GLSL Shaders for the Giant Ancient Cosmic Tree Environment

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
      vec3 dir = normalize(vWorldDir);
      vec2 uvSphere = vec2(atan(dir.z, dir.x) * 0.45, dir.y * 2.2);
      float t = uTime * 0.012;

      float n1 = fbm(uvSphere * 1.4 + vec2(t, -t * 0.35));
      float n2 = fbm(uvSphere * 2.6 - vec2(t * 0.4, t * 0.25) + n1 * 0.65);

      // Vertical gradient: deep abyssal slate below, twilight indigo at horizon, warm celestial sanctuary light overhead
      vec3 abyssColor = vec3(0.012, 0.020, 0.038);
      vec3 horizonColor = vec3(0.032, 0.055, 0.095);
      vec3 zenithColor = vec3(0.055, 0.090, 0.135);

      float upMask = smoothstep(-0.65, 0.85, dir.y);
      vec3 baseSky = mix(abyssColor, horizonColor, smoothstep(-0.7, 0.05, dir.y));
      baseSky = mix(baseSky, zenithColor, smoothstep(0.0, 0.9, dir.y));

      // Subtle distant nebula clouds
      vec3 warmNebula = vec3(0.24, 0.16, 0.08) * smoothstep(0.52, 0.88, n2) * (0.35 + 0.45 * upMask);
      vec3 tealNebula = vec3(0.04, 0.18, 0.22) * smoothstep(0.45, 0.85, n1) * 0.42;

      // Subtle distant sanctuary glow behind the upper tree crown
      float crownHalo = pow(max(0.0, dot(dir, normalize(vec3(0.0, 0.35, -0.94)))), 3.2);
      vec3 haloGlow = vec3(0.22, 0.18, 0.11) * crownHalo * 0.65;

      // Fine distant starfield in the clearer sky regions
      vec2 starGrid = floor(uvSphere * 130.0);
      float starSeed = hash(starGrid);
      float starBright = smoothstep(0.9965, 0.9998, starSeed) * smoothstep(-0.15, 0.45, dir.y);
      float twinkle = 0.65 + 0.35 * sin(uTime * 1.8 + starSeed * 60.0);

      vec3 col = baseSky + warmNebula + tealNebula + haloGlow + vec3(0.95, 0.97, 1.0) * starBright * twinkle * 0.55;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

/**
 * Physically-inspired lit ancient tree bark shader.
 * Renders rugged, furrowed wooden bark with deep vertical ridges, knots,
 * 3-point warm/cool directional + rim lighting, and gentle streams of
 * cosmic energy strictly accented inside recessed bark grooves.
 */
export const ANCIENT_BARK_SHADER = {
  vertexShader: `
    attribute float aBarkGroove;
    attribute float aVeinWeight;

    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vWorldNormal;
    varying float vBarkGroove;
    varying float vVeinWeight;

    void main() {
      vUv = uv;
      vBarkGroove = aBarkGroove;
      vVeinWeight = aVeinWeight;

      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPosition.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);

      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D uBarkMap;
    uniform float uTime;
    uniform vec3 uCameraPos;

    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vWorldNormal;
    varying float vBarkGroove;
    varying float vVeinWeight;

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
        p = p * 2.04 + vec2(5.3, 9.7);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // 1. Sample procedural bark texture + multi-scale procedural wood grain
      vec2 barkUv = vec2(vUv.y * 3.0, vUv.x * 6.5);
      vec4 texSample = texture2D(uBarkMap, barkUv);
      vec4 detailSample = texture2D(uBarkMap, barkUv * vec2(2.4, 3.2) + vec2(0.37, 0.19));

      // Combine geometric flute/ridge attribute (vBarkGroove: 0 = deep furrow, 1 = raised ridge)
      // with fine canvas bark height stored in texSample.a
      float microHeight = mix(texSample.a, detailSample.a, 0.38);
      float ridgeFactor = clamp(vBarkGroove * 0.62 + microHeight * 0.38, 0.0, 1.0);

      // Perturb normal slightly using bark grain derivatives for crisp rugged bark relief
      vec3 N = normalize(vWorldNormal);
      vec3 viewDir = normalize(uCameraPos - vWorldPos);
      float grainBump = (microHeight - 0.5) * 0.45;
      N = normalize(N + vec3(grainBump * N.z, grainBump * 0.25, -grainBump * N.x));

      // 2. Ancient wood bark palette: deep shadowed crevice umber, weathered heartwood brown,
      // warm sunlit redwood/mahogany ridges, and subtle lichen/moss tint on upper-facing bark
      vec3 creviceWood = vec3(0.075, 0.048, 0.034);
      vec3 midBarkWood = vec3(0.21, 0.145, 0.102);
      vec3 ridgeBarkWood = vec3(0.34, 0.245, 0.175);
      vec3 ancientMoss = vec3(0.11, 0.19, 0.14);

      vec3 barkAlbedo = mix(creviceWood, midBarkWood, smoothstep(0.12, 0.55, ridgeFactor));
      barkAlbedo = mix(barkAlbedo, ridgeBarkWood, smoothstep(0.55, 0.92, ridgeFactor));
      barkAlbedo *= (0.75 + 0.5 * texSample.rgb);

      // Subtle mossy patina on upward-facing bark surfaces & upper root shoulders
      float upwardMask = smoothstep(0.25, 0.85, N.y) * smoothstep(-10.0, 10.0, vWorldPos.y);
      barkAlbedo = mix(barkAlbedo, ancientMoss, upwardMask * 0.22 * smoothstep(0.4, 0.8, detailSample.g));

      // 3. Three-Point Cosmic Sanctuary Lighting + Ambient Occlusion in bark furrows
      float ao = mix(0.28, 1.0, smoothstep(0.05, 0.72, ridgeFactor));

      // Key light: warm golden canopy light from above and slightly in front
      vec3 keyDir = normalize(vec3(0.28, 0.78, 0.55));
      float diffKey = max(0.0, dot(N, keyDir));
      vec3 keyLight = vec3(1.05, 0.88, 0.66) * (diffKey * 0.88 + 0.12) * ao;

      // Secondary fill light from left-front so the trunk face in front of the visitor is clearly readable
      vec3 fillDir = normalize(vec3(-0.55, 0.22, 0.80));
      float diffFill = max(0.0, dot(N, fillDir));
      vec3 fillLight = vec3(0.58, 0.72, 0.88) * diffFill * 0.42 * ao;

      // Abyssal bounce light from below (cool bioluminescent teal-indigo mist)
      vec3 bounceDir = normalize(vec3(0.0, -0.9, 0.4));
      float diffBounce = max(0.0, dot(N, bounceDir));
      vec3 bounceLight = vec3(0.22, 0.55, 0.65) * diffBounce * 0.36 * ao;

      // Grazing rim light on trunk and branch silhouettes
      float fresnel = pow(1.0 - max(0.0, dot(N, viewDir)), 3.2);
      vec3 rimColor = mix(vec3(0.35, 0.75, 0.85), vec3(0.98, 0.82, 0.52), smoothstep(-4.0, 14.0, vWorldPos.y));
      vec3 rimLight = rimColor * fresnel * 0.48 * smoothstep(0.2, 0.85, ridgeFactor);

      vec3 litBark = barkAlbedo * (keyLight + fillLight + bounceLight + vec3(0.18, 0.17, 0.20) * ao) + rimLight;

      // 4. Gentle Streams of Luminous Cosmic Energy strictly inside selected deep bark grooves
      // Energy only appears in the recessed crevices (ridgeFactor < 0.28) and only along sparse vein paths
      float creviceChannel = 1.0 - smoothstep(0.08, 0.27, ridgeFactor);
      float veinNoise = fbm(vec2(vUv.y * 5.0, vUv.x * 2.2 - uTime * 0.08));
      float veinStream = smoothstep(0.56, 0.82, veinNoise);

      // Gentle travelling pulse flowing upward from roots through trunk into branches
      float flowWave = 0.5 + 0.5 * sin(vUv.x * 18.0 - uTime * 0.95 + vUv.y * 12.566);
      float flowPulse = pow(flowWave, 2.6);

      vec3 sapGold = vec3(1.0, 0.78, 0.32);
      vec3 sapCyan = vec3(0.25, 0.88, 0.82);
      vec3 energyColor = mix(sapCyan, sapGold, smoothstep(-6.0, 10.0, vWorldPos.y + sin(vUv.y * 6.28) * 3.0));

      float energyIntensity = creviceChannel * veinStream * (0.28 + 0.72 * flowPulse) * vVeinWeight * 0.85;
      vec3 finalColor = litBark + energyColor * energyIntensity;

      // 5. Atmospheric distance fog into the deep cosmic cloudscape
      float dist = length(vWorldPos - uCameraPos);
      float fogFactor = smoothstep(16.0, 56.0, dist);
      vec3 fogColor = mix(vec3(0.022, 0.038, 0.068), vec3(0.045, 0.075, 0.115), smoothstep(-12.0, 18.0, vWorldPos.y));
      finalColor = mix(finalColor, fogColor, fogFactor * 0.82);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

/**
 * Instanced 3D Canopy Foliage Cluster Shader.
 * Renders hundreds of lush, organic leaf clusters overhead in the upper tree crown
 * with soft alpha-cutout leaf silhouettes, warm backlit starlight scattering, and gentle wind sway.
 */
export const CANOPY_FOLIAGE_SHADER = {
  vertexShader: `
    attribute vec3 aClusterColor;
    attribute float aClusterSeed;

    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vWorldNormal;
    varying vec3 vColor;
    varying float vSeed;

    void main() {
      vUv = uv;
      vColor = aClusterColor;
      vSeed = aClusterSeed;

      // Apply instance transform + subtle organic wind sway in the canopy
      vec4 instPos = instanceMatrix * vec4(position, 1.0);
      float sway = sin(uTime * 0.75 + aClusterSeed * 6.28 + instPos.x * 0.18) * 0.22;
      instPos.x += sway;
      instPos.y += cos(uTime * 0.6 + aClusterSeed * 4.1) * 0.12;

      vec4 worldPosition = modelMatrix * instPos;
      vWorldPos = worldPosition.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);

      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uCameraPos;

    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vWorldNormal;
    varying vec3 vColor;
    varying float vSeed;

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
      // Sculpt organic multi-lobed leaf cluster silhouette from UV + noise
      vec2 p = (vUv - 0.5) * 2.0;
      float r = length(p);
      float leafNoise = noise(vUv * 9.5 + vec2(vSeed * 13.7, vSeed * 7.3)) * 0.55
                      + noise(vUv * 22.0 - vec2(vSeed * 5.1, 2.4)) * 0.45;

      float leafMask = smoothstep(0.95, 0.38, r - (leafNoise - 0.48) * 0.52);
      if (leafMask < 0.18) discard;

      vec3 N = normalize(vWorldNormal);
      vec3 keyDir = normalize(vec3(0.25, 0.85, 0.45));
      float diff = max(0.0, dot(N, keyDir)) * 0.65 + 0.35;

      // Subsurface scattering & bioluminescent leaf tips
      float rimGlow = smoothstep(0.45, 0.88, leafNoise) * (0.65 + 0.35 * sin(uTime * 1.1 + vSeed * 12.0));
      vec3 shadowFoliage = vec3(0.04, 0.11, 0.12);
      vec3 litFoliage = vColor * diff;
      vec3 tipGlow = mix(vec3(0.28, 0.82, 0.72), vec3(0.98, 0.84, 0.44), fract(vSeed * 3.7)) * rimGlow * 0.32;

      vec3 col = mix(shadowFoliage, litFoliage, smoothstep(0.2, 0.85, leafNoise * diff)) + tipGlow;

      // Atmospheric depth fade into upper canopy mist
      float dist = length(vWorldPos - uCameraPos);
      float fog = smoothstep(18.0, 52.0, dist);
      col = mix(col, vec3(0.038, 0.068, 0.105), fog * 0.75);

      gl_FragColor = vec4(col, leafMask * 0.92);
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

      float radialMask = pow(1.0 - r, 1.75);
      float t = uTime * 0.032;
      float billow = fbm(p * 2.1 + vec2(uSeed + t, uSeed * 0.7 - t * 0.5));
      float cloudDensity = smoothstep(0.22, 0.85, billow * radialMask * 1.48);

      float rimLight = smoothstep(0.32, 0.68, billow) * (1.0 - smoothstep(0.68, 0.92, billow));
      vec3 col = mix(uCloudColor, uRimColor, rimLight * 0.55);

      gl_FragColor = vec4(col, cloudDensity * uOpacity);
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
      gl_PointSize = aSize * uPixelRatio * (105.0 / max(-mvPosition.z, 1.0));
      gl_PointSize = clamp(gl_PointSize, 1.2, 18.0);
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
      vec3 col = mix(vColor, vec3(1.0, 0.98, 0.92), pow(1.0 - d, 4.0) * 0.5);
      gl_FragColor = vec4(col, glow * vAlpha);
    }
  `,
};
