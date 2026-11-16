// Visionexa '26 — Giant Ancient Cosmic Tree 3D Environment (Three.js r128)
import {
  createSeededRandom,
  CAMERA_CONFIG,
  TRUNK_SPINE,
  PRIMARY_BOUGHS,
  PRIMARY_ROOTS,
} from './gatewayConfig.js';
import {
  INFINITE_VOID_DOME_SHADER,
  ANCIENT_BARK_SHADER,
  CANOPY_FOLIAGE_SHADER,
  VOLUMETRIC_CLOUD_SHADER,
  PARTICLE_STREAM_SHADER,
} from './gatewayShaders.js';

export class MultiverseGateway {
  constructor(options = {}) {
    this.container = options.container;
    this.reducedMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.rootGroup = null;

    this.voidDomeMat = null;
    this.barkTexture = null;
    this.barkMaterial = null;
    this.treeMesh = null;
    this.foliageMesh = null;
    this.foliageMaterial = null;
    this.cloudMeshes = [];
    this.cosmicParticles = null;
    this.particleData = [];
    this.canopyBranchTips = [];

    // Free-look camera orientation state (Up to Canopy, Down to Roots, Left/Right around Trunk)
    this.pointerNDC = new window.THREE.Vector2(0, 0);
    this.smoothPointer = new window.THREE.Vector2(0, 0);
    this.yaw = CAMERA_CONFIG.initialYaw;
    this.pitch = CAMERA_CONFIG.initialPitch;
    this.targetYaw = CAMERA_CONFIG.initialYaw;
    this.targetPitch = CAMERA_CONFIG.initialPitch;
    this.isDragging = false;
    this.dragLast = { x: 0, y: 0 };

    this.clock = new window.THREE.Clock();
    this.rafId = 0;
    this.disposed = false;

    this.init();
  }

  init() {
    const THREE = window.THREE;
    if (!THREE) throw new Error('Three.js is required for MultiverseGateway');

    this.scene = new THREE.Scene();

    const w = window.innerWidth;
    const h = window.innerHeight;
    const isMobile = w < 768 || w / h < 0.85;
    this.camera = new THREE.PerspectiveCamera(
      isMobile ? 64 : 54,
      w / h,
      0.1,
      260
    );
    this.baseEyePos = new THREE.Vector3(
      CAMERA_CONFIG.eyePos[0],
      CAMERA_CONFIG.eyePos[1],
      isMobile ? CAMERA_CONFIG.eyePos[2] + 1.1 : CAMERA_CONFIG.eyePos[2]
    );
    this.camera.position.copy(this.baseEyePos);

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
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0x03060c, 1);
    if (THREE.sRGBEncoding) {
      this.renderer.outputEncoding = THREE.sRGBEncoding;
    }

    this.renderer.domElement.className = 'gateway-canvas';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.container.appendChild(this.renderer.domElement);

    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this.buildInfiniteVoidDome();
    this.buildAncientCosmicTree();
    this.buildCanopyFoliage();
    this.buildAtmosphericCloudLayers();
    this.buildCosmicParticleSystem();

    this.bindEvents();
    this.update();
    this.startLoop();
  }

  enterUniverse(universeId = 'techverse') {
    this.dispose();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    if (
      window.VisionexaUniverse &&
      typeof window.VisionexaUniverse.enter === 'function'
    ) {
      window.VisionexaUniverse.enter(universeId);
    }
  }

  buildInfiniteVoidDome() {
    const THREE = window.THREE;
    const geo = new THREE.SphereGeometry(140, 48, 36);
    this.voidDomeMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: INFINITE_VOID_DOME_SHADER.vertexShader,
      fragmentShader: INFINITE_VOID_DOME_SHADER.fragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const dome = new THREE.Mesh(geo, this.voidDomeMat);
    dome.renderOrder = -30;
    this.scene.add(dome);
  }

  /**
   * Generates a procedural tileable 512x512 wood bark texture on an offscreen canvas.
   * RGB stores fibrous weathered wood grain variations; Alpha stores fine bark ridge height.
   */
  createProceduralBarkTexture() {
    const THREE = window.THREE;
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    const tau = Math.PI * 2;
    for (let y = 0; y < size; y++) {
      const v = y / size;
      for (let x = 0; x < size; x++) {
        const u = x / size;

        // Seamless periodic bark ridges along u (circumference) with vertical wave along v (length)
        const warp =
          Math.sin(v * tau * 2.0 + Math.cos(u * tau * 3.0) * 1.2) * 0.35 +
          Math.cos(v * tau * 5.0 - u * tau * 2.0) * 0.18;
        const primaryFurrow =
          0.5 + 0.5 * Math.sin((u * 14.0 + warp) * tau);
        const secondaryFurrow =
          0.5 +
          0.5 *
            Math.cos(
              (u * 29.0 - warp * 1.4) * tau + Math.sin(v * tau * 7.0) * 0.7
            );
        const fineFibers =
          0.5 +
          0.5 *
            Math.sin(
              u * tau * 64.0 + Math.sin(v * tau * 19.0 + u * tau * 5.0) * 1.6
            );

        // Occasional organic bark scales & horizontal plates
        const plate =
          0.5 + 0.5 * Math.sin(v * tau * 24.0 + primaryFurrow * 3.2);

        const height = Math.max(
          0,
          Math.min(
            1,
            primaryFurrow * 0.52 +
              secondaryFurrow * 0.28 +
              fineFibers * 0.12 +
              plate * 0.08
          )
        );

        // Rich fibrous wood grain coloration
        const r = Math.floor((0.55 + 0.45 * height) * 255);
        const g = Math.floor(
          (0.48 + 0.42 * height + 0.08 * secondaryFurrow) * 255
        );
        const b = Math.floor((0.42 + 0.36 * height) * 255);
        const a = Math.floor(height * 255);

        const idx = (y * size + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Builds a single organic, tapered, fluted, knotted wooden limb BufferGeometry
   * along a 3D CatmullRom spline with custom `aBarkGroove` and `aVeinWeight` attributes.
   */
  createTaperedLimbGeometry(cfg, rand) {
    const THREE = window.THREE;
    const curve = new THREE.CatmullRomCurve3(
      cfg.points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
    );

    const tubularSegments = cfg.tubularSegments || 36;
    const radialSegments = cfg.radialSegments || 16;
    const frames = curve.computeFrenetFrames(tubularSegments, false);

    const radiusStart = cfg.radiusStart;
    const radiusEnd = cfg.radiusEnd;
    const taperPower = cfg.taperPower || 0.85;
    const buttressCount = cfg.buttressCount || 0;
    const buttressStrength = cfg.buttressStrength || 0;
    const barkFlutes = cfg.barkFlutes || 6;
    const fluteDepth = cfg.fluteDepth || 0.08;
    const knotStrength = cfg.knotStrength || 0.06;
    const twistTurns = cfg.twistTurns || 0.2;
    const energyVeinWeight =
      cfg.energyVeinWeight !== undefined ? cfg.energyVeinWeight : 0.6;

    const knotPhaseA = rand() * Math.PI * 2;
    const knotPhaseB = rand() * Math.PI * 2;
    const flutePhase = rand() * Math.PI * 2;

    const vertexCount = (tubularSegments + 1) * (radialSegments + 1);
    const positions = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const barkGrooves = new Float32Array(vertexCount);
    const veinWeights = new Float32Array(vertexCount);
    const indices = [];

    const P = new THREE.Vector3();
    const N = new THREE.Vector3();
    const B = new THREE.Vector3();
    const vertexPos = new THREE.Vector3();

    let vIdx = 0;
    for (let i = 0; i <= tubularSegments; i++) {
      const u = i / tubularSegments;
      curve.getPointAt(u, P);

      N.copy(frames.normals[i]);
      B.copy(frames.binormals[i]);

      // Base radius taper along limb length
      const baseRadius =
        radiusEnd + (radiusStart - radiusEnd) * Math.pow(1.0 - u, taperPower);

      // Buttress flare near base of trunk
      const buttressEnv =
        buttressCount > 0 ? Math.pow(Math.max(0.0, 1.0 - u * 2.1), 1.8) : 0.0;

      for (let j = 0; j <= radialSegments; j++) {
        const v = j / radialSegments;
        const theta = v * Math.PI * 2;

        // Twisted bark flutes running along the limb
        const twistedAngle =
          theta * barkFlutes + u * twistTurns * Math.PI * 2 + flutePhase;
        const fluteWave =
          0.5 +
          0.5 *
            Math.sin(
              twistedAngle + Math.sin(u * Math.PI * 4.0 + knotPhaseA) * 0.6
            );

        // Root-buttress muscular lobes at the base of the trunk
        const buttressWave =
          buttressCount > 0
            ? Math.pow(
                0.5 +
                  0.5 *
                    Math.cos(theta * buttressCount + u * 2.2 + knotPhaseB * 0.3),
                1.6
              ) *
              buttressStrength *
              buttressEnv
            : 0.0;

        // Natural gnarled wood knots/burls along the bark
        const knotWave =
          Math.pow(
            0.5 +
              0.5 *
                Math.sin(u * Math.PI * 7.0 + theta * 2.0 + knotPhaseA) *
                Math.cos(u * Math.PI * 5.0 - theta * 3.0 + knotPhaseB),
            3.0
          ) *
          knotStrength *
          (1.0 - u * 0.5);

        const radialDisplacement =
          1.0 +
          (fluteWave - 0.5) * 2.0 * fluteDepth +
          buttressWave +
          knotWave;

        const r = Math.max(0.02, baseRadius * radialDisplacement);
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        vertexPos
          .copy(P)
          .addScaledVector(N, cosT * r)
          .addScaledVector(B, sinT * r);

        positions[vIdx * 3] = vertexPos.x;
        positions[vIdx * 3 + 1] = vertexPos.y;
        positions[vIdx * 3 + 2] = vertexPos.z;

        uvs[vIdx * 2] = u;
        uvs[vIdx * 2 + 1] = v;

        // 0.0 in recessed bark furrows, 1.0 on raised bark ridges
        const grooveVal = Math.max(
          0.0,
          Math.min(1.0, fluteWave * 0.8 + (buttressWave > 0.05 ? 0.2 : 0.0))
        );
        barkGrooves[vIdx] = grooveVal;

        // Fade energy vein weight smoothly toward the fine outer branch tips
        veinWeights[vIdx] = energyVeinWeight * (1.0 - u * 0.55);
        vIdx++;
      }
    }

    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j;
        const b = (i + 1) * (radialSegments + 1) + j;
        const c = (i + 1) * (radialSegments + 1) + (j + 1);
        const d = i * (radialSegments + 1) + (j + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setIndex(indices);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setAttribute('aBarkGroove', new THREE.BufferAttribute(barkGrooves, 1));
    geo.setAttribute('aVeinWeight', new THREE.BufferAttribute(veinWeights, 1));
    geo.computeVertexNormals();

    // Stitch normals across the v=0 / v=1 UV seam so cylindrical bark shading is 100% seamless
    const normalAttr = geo.attributes.normal;
    const nA = new THREE.Vector3();
    const nB = new THREE.Vector3();
    for (let i = 0; i <= tubularSegments; i++) {
      const idxStart = i * (radialSegments + 1);
      const idxEnd = idxStart + radialSegments;
      nA.fromBufferAttribute(normalAttr, idxStart);
      nB.fromBufferAttribute(normalAttr, idxEnd);
      nA.add(nB).normalize();
      normalAttr.setXYZ(idxStart, nA.x, nA.y, nA.z);
      normalAttr.setXYZ(idxEnd, nA.x, nA.y, nA.z);
    }

    return { geo, curve };
  }

  /**
   * Merges an array of indexed BufferGeometries into a single BufferGeometry
   * so the entire colossal cosmic tree renders in a single GPU draw call.
   */
  mergeLimbGeometries(geometries) {
    const THREE = window.THREE;
    let totalVertices = 0;
    let totalIndices = 0;

    for (let i = 0; i < geometries.length; i++) {
      const g = geometries[i];
      totalVertices += g.attributes.position.count;
      totalIndices += g.index.count;
    }

    const positions = new Float32Array(totalVertices * 3);
    const normals = new Float32Array(totalVertices * 3);
    const uvs = new Float32Array(totalVertices * 2);
    const barkGrooves = new Float32Array(totalVertices);
    const veinWeights = new Float32Array(totalVertices);
    const indices =
      totalVertices > 65535
        ? new Uint32Array(totalIndices)
        : new Uint16Array(totalIndices);

    let vertexOffset = 0;
    let indexOffset = 0;

    for (let i = 0; i < geometries.length; i++) {
      const g = geometries[i];
      const vCount = g.attributes.position.count;
      const idxArray = g.index.array;

      positions.set(g.attributes.position.array, vertexOffset * 3);
      normals.set(g.attributes.normal.array, vertexOffset * 3);
      uvs.set(g.attributes.uv.array, vertexOffset * 2);
      barkGrooves.set(g.attributes.aBarkGroove.array, vertexOffset);
      veinWeights.set(g.attributes.aVeinWeight.array, vertexOffset);

      for (let j = 0; j < idxArray.length; j++) {
        indices[indexOffset + j] = idxArray[j] + vertexOffset;
      }

      vertexOffset += vCount;
      indexOffset += idxArray.length;
      g.dispose();
    }

    const merged = new THREE.BufferGeometry();
    merged.setIndex(new THREE.BufferAttribute(indices, 1));
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    merged.setAttribute(
      'aBarkGroove',
      new THREE.BufferAttribute(barkGrooves, 1)
    );
    merged.setAttribute(
      'aVeinWeight',
      new THREE.BufferAttribute(veinWeights, 1)
    );
    return merged;
  }

  /**
   * Builds the complete 3D organic cosmic tree:
   * - Colossal fluted trunk directly in front of the visitor
   * - 10 massive primary boughs arching overhead and outward
   * - ~40 secondary branches & ~80 tertiary sub-branches splitting organically into the canopy
   * - 12 giant primary buttress/underfoot roots & ~24 secondary root tendrils plunging into the abyss
   */
  buildAncientCosmicTree() {
    const THREE = window.THREE;
    const rand = createSeededRandom(2026);
    const limbGeometries = [];
    this.canopyBranchTips = [];

    // 1. Colossal Central Trunk
    const trunkResult = this.createTaperedLimbGeometry(TRUNK_SPINE, rand);
    limbGeometries.push(trunkResult.geo);

    // 2. Primary Boughs + Procedural Secondary & Tertiary Branches
    PRIMARY_BOUGHS.forEach((boughCfg, bIdx) => {
      const boughResult = this.createTaperedLimbGeometry(
        {
          ...boughCfg,
          tubularSegments: 42,
          radialSegments: 20,
          knotStrength: 0.09,
        },
        rand
      );
      limbGeometries.push(boughResult.geo);

      const boughCurve = boughResult.curve;
      const tipPt = boughCurve.getPointAt(1.0);
      this.canopyBranchTips.push({
        pos: tipPt.clone(),
        spread: 4.2,
        count: 14,
      });

      // Spawn 4 secondary branches splitting off each primary bough
      const splitFractions = [0.28, 0.48, 0.68, 0.85];
      splitFractions.forEach((tSplit, sIdx) => {
        const origin = boughCurve.getPointAt(tSplit);
        const tangent = boughCurve.getTangentAt(tSplit).normalize();
        const parentRadius =
          boughCfg.radiusEnd +
          (boughCfg.radiusStart - boughCfg.radiusEnd) *
            Math.pow(1.0 - tSplit, boughCfg.taperPower || 0.88);

        // Alternate left/right & upward branching angles naturally
        const sideSign = (bIdx + sIdx) % 2 === 0 ? 1.0 : -1.0;
        const sideVec = new THREE.Vector3(-tangent.z, 0.35, tangent.x)
          .normalize()
          .multiplyScalar(sideSign);
        const upVec = new THREE.Vector3(0, 1, 0);

        const branchDir = tangent
          .clone()
          .multiplyScalar(0.58)
          .addScaledVector(sideVec, 0.48 + rand() * 0.25)
          .addScaledVector(upVec, 0.32 + rand() * 0.28)
          .normalize();

        const secLength = (7.5 + rand() * 5.2) * (1.0 - tSplit * 0.32);
        const secPoints = [];
        const pCurr = origin.clone();
        secPoints.push([pCurr.x, pCurr.y, pCurr.z]);

        for (let step = 1; step <= 4; step++) {
          const stepLen = secLength / 4;
          branchDir.y += 0.08 + rand() * 0.08;
          branchDir.x += (rand() - 0.5) * 0.22;
          branchDir.z += (rand() - 0.5) * 0.22;
          branchDir.normalize();
          pCurr.addScaledVector(branchDir, stepLen);
          secPoints.push([pCurr.x, pCurr.y, pCurr.z]);
        }

        const secRadiusStart = parentRadius * (0.62 - sIdx * 0.04);
        const secRadiusEnd = Math.max(0.11, secRadiusStart * 0.24);

        const secResult = this.createTaperedLimbGeometry(
          {
            points: secPoints,
            radiusStart: secRadiusStart,
            radiusEnd: secRadiusEnd,
            taperPower: 0.88,
            barkFlutes: 5,
            fluteDepth: 0.07,
            knotStrength: 0.06,
            twistTurns: sideSign * 0.18,
            tubularSegments: 24,
            radialSegments: 12,
            energyVeinWeight: boughCfg.energyVeinWeight * 0.65,
          },
          rand
        );
        limbGeometries.push(secResult.geo);

        const secCurve = secResult.curve;
        this.canopyBranchTips.push({
          pos: secCurve.getPointAt(0.75),
          spread: 3.2,
          count: 9,
        });
        this.canopyBranchTips.push({
          pos: secCurve.getPointAt(1.0),
          spread: 3.6,
          count: 11,
        });

        // Spawn 2 tertiary sub-branches splitting from each secondary branch
        [0.45, 0.78].forEach((tTert, tIdx) => {
          const tertOrigin = secCurve.getPointAt(tTert);
          const tertTan = secCurve.getTangentAt(tTert).normalize();
          const tertSign = tIdx % 2 === 0 ? -sideSign : sideSign;
          const tertSide = new THREE.Vector3(-tertTan.z, 0.4, tertTan.x)
            .normalize()
            .multiplyScalar(tertSign);

          const tertDir = tertTan
            .clone()
            .multiplyScalar(0.62)
            .addScaledVector(tertSide, 0.52)
            .addScaledVector(upVec, 0.35 + rand() * 0.25)
            .normalize();

          const tertLen = 3.8 + rand() * 3.2;
          const tertPts = [];
          const tPos = tertOrigin.clone();
          tertPts.push([tPos.x, tPos.y, tPos.z]);

          for (let k = 1; k <= 3; k++) {
            tertDir.y += 0.1 + rand() * 0.08;
            tertDir.x += (rand() - 0.5) * 0.25;
            tertDir.z += (rand() - 0.5) * 0.25;
            tertDir.normalize();
            tPos.addScaledVector(tertDir, tertLen / 3);
            tertPts.push([tPos.x, tPos.y, tPos.z]);
          }

          const tertRadiusStart =
            (secRadiusEnd + (secRadiusStart - secRadiusEnd) * (1.0 - tTert)) *
            0.65;
          const tertResult = this.createTaperedLimbGeometry(
            {
              points: tertPts,
              radiusStart: Math.max(0.14, tertRadiusStart),
              radiusEnd: 0.045,
              taperPower: 0.9,
              barkFlutes: 4,
              fluteDepth: 0.05,
              knotStrength: 0.04,
              twistTurns: tertSign * 0.12,
              tubularSegments: 14,
              radialSegments: 8,
              energyVeinWeight: 0.32,
            },
            rand
          );
          limbGeometries.push(tertResult.geo);

          this.canopyBranchTips.push({
            pos: tertResult.curve.getPointAt(1.0),
            spread: 2.6,
            count: 7,
          });
        });
      });
    });

    // 3. Giant Primary Buttress Roots + Secondary Root Tendrils
    PRIMARY_ROOTS.forEach((rootCfg, rIdx) => {
      const rootResult = this.createTaperedLimbGeometry(
        {
          ...rootCfg,
          tubularSegments: 38,
          radialSegments: 18,
          knotStrength: 0.1,
        },
        rand
      );
      limbGeometries.push(rootResult.geo);

      const rootCurve = rootResult.curve;
      // Spawn 2 secondary root tendrils off each primary root plunging into the abyss
      [0.38, 0.68].forEach((tSplit, sIdx) => {
        const rOrigin = rootCurve.getPointAt(tSplit);
        const rTan = rootCurve.getTangentAt(tSplit).normalize();
        const parentRad =
          rootCfg.radiusEnd +
          (rootCfg.radiusStart - rootCfg.radiusEnd) *
            Math.pow(1.0 - tSplit, rootCfg.taperPower || 0.82);

        const sideSign = (rIdx + sIdx) % 2 === 0 ? 1.0 : -1.0;
        const sideVec = new THREE.Vector3(-rTan.z, -0.25, rTan.x)
          .normalize()
          .multiplyScalar(sideSign);
        const downVec = new THREE.Vector3(0, -1, 0);

        const subRootDir = rTan
          .clone()
          .multiplyScalar(0.6)
          .addScaledVector(sideVec, 0.45 + rand() * 0.2)
          .addScaledVector(downVec, 0.35 + rand() * 0.25)
          .normalize();

        const subLen = 5.5 + rand() * 4.5;
        const subPts = [];
        const rCurr = rOrigin.clone();
        subPts.push([rCurr.x, rCurr.y, rCurr.z]);

        for (let step = 1; step <= 4; step++) {
          subRootDir.y -= 0.12 + rand() * 0.08;
          subRootDir.x += (rand() - 0.5) * 0.22;
          subRootDir.z += (rand() - 0.5) * 0.22;
          subRootDir.normalize();
          rCurr.addScaledVector(subRootDir, subLen / 4);
          subPts.push([rCurr.x, rCurr.y, rCurr.z]);
        }

        const subRootGeo = this.createTaperedLimbGeometry(
          {
            points: subPts,
            radiusStart: parentRad * 0.58,
            radiusEnd: 0.08,
            taperPower: 0.85,
            barkFlutes: 5,
            fluteDepth: 0.07,
            knotStrength: 0.06,
            twistTurns: sideSign * 0.16,
            tubularSegments: 18,
            radialSegments: 10,
            energyVeinWeight: rootCfg.energyVeinWeight * 0.55,
          },
          rand
        );
        limbGeometries.push(subRootGeo.geo);
      });
    });

    // Merge all wooden bark geometries into a single draw call
    const mergedTreeGeo = this.mergeLimbGeometries(limbGeometries);
    this.barkTexture = this.createProceduralBarkTexture();

    this.barkMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uBarkMap: { value: this.barkTexture },
        uTime: { value: 0 },
        uCameraPos: { value: this.camera.position.clone() },
      },
      vertexShader: ANCIENT_BARK_SHADER.vertexShader,
      fragmentShader: ANCIENT_BARK_SHADER.fragmentShader,
      side: THREE.FrontSide,
    });

    this.treeMesh = new THREE.Mesh(mergedTreeGeo, this.barkMaterial);
    this.treeMesh.renderOrder = 0;
    this.rootGroup.add(this.treeMesh);
  }

  /**
   * Builds the overarching 3D leaf canopy overhead using InstancedMesh
   * so looking upward reveals a massive, lush, recognizable tree crown.
   */
  buildCanopyFoliage() {
    const THREE = window.THREE;
    const rand = createSeededRandom(777);

    // Build a 2-plane crossed card per instance so leaf clusters have 3D volume from all viewing angles
    const p1 = new THREE.PlaneGeometry(1, 1);
    const p2 = new THREE.PlaneGeometry(1, 1);
    p2.rotateY(Math.PI * 0.5);
    p2.rotateZ(0.25);

    const pos1 = p1.attributes.position.array;
    const pos2 = p2.attributes.position.array;
    const norm1 = p1.attributes.normal.array;
    const norm2 = p2.attributes.normal.array;
    const uv1 = p1.attributes.uv.array;
    const uv2 = p2.attributes.uv.array;
    const idx1 = p1.index.array;
    const idx2 = p2.index.array;

    const combinedPos = new Float32Array(pos1.length + pos2.length);
    combinedPos.set(pos1, 0);
    combinedPos.set(pos2, pos1.length);

    const combinedNorm = new Float32Array(norm1.length + norm2.length);
    combinedNorm.set(norm1, 0);
    combinedNorm.set(norm2, norm1.length);

    const combinedUv = new Float32Array(uv1.length + uv2.length);
    combinedUv.set(uv1, 0);
    combinedUv.set(uv2, uv1.length);

    const combinedIdx = new Uint16Array(idx1.length + idx2.length);
    combinedIdx.set(idx1, 0);
    for (let i = 0; i < idx2.length; i++) {
      combinedIdx[idx1.length + i] = idx2[i] + 4;
    }

    p1.dispose();
    p2.dispose();

    const clusterGeo = new THREE.BufferGeometry();
    clusterGeo.setIndex(new THREE.BufferAttribute(combinedIdx, 1));
    clusterGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(combinedPos, 3)
    );
    clusterGeo.setAttribute(
      'normal',
      new THREE.BufferAttribute(combinedNorm, 3)
    );
    clusterGeo.setAttribute('uv', new THREE.BufferAttribute(combinedUv, 2));

    let totalInstances = 0;
    this.canopyBranchTips.forEach((tip) => {
      totalInstances += tip.count;
    });

    const clusterColors = new Float32Array(totalInstances * 3);
    const clusterSeeds = new Float32Array(totalInstances);

    const foliagePalette = [
      new THREE.Color('#164e46'), // Deep emerald canopy foliage
      new THREE.Color('#1e5b4f'), // Lush forest teal-green
      new THREE.Color('#276749'), // Ancient moss green
      new THREE.Color('#2d5a4c'), // Twilight sage foliage
      new THREE.Color('#3b6e52'), // Warm sun-kissed crown leaf green
    ];

    this.foliageMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraPos: { value: this.camera.position.clone() },
      },
      vertexShader: CANOPY_FOLIAGE_SHADER.vertexShader,
      fragmentShader: CANOPY_FOLIAGE_SHADER.fragmentShader,
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
    });

    this.foliageMesh = new THREE.InstancedMesh(
      clusterGeo,
      this.foliageMaterial,
      totalInstances
    );

    const dummy = new THREE.Object3D();
    let instIdx = 0;

    this.canopyBranchTips.forEach((tip) => {
      for (let k = 0; k < tip.count; k++) {
        const angle = rand() * Math.PI * 2;
        const radius = Math.pow(rand(), 0.7) * tip.spread;
        const yOff = (rand() - 0.35) * tip.spread * 0.65;

        dummy.position.set(
          tip.pos.x + Math.cos(angle) * radius,
          tip.pos.y + yOff,
          tip.pos.z + Math.sin(angle) * radius
        );
        dummy.rotation.set(
          (rand() - 0.5) * 0.9,
          rand() * Math.PI * 2,
          (rand() - 0.5) * 0.9
        );
        const scale = 2.4 + rand() * 2.8;
        dummy.scale.set(scale, scale * (0.78 + rand() * 0.3), scale);
        dummy.updateMatrix();
        this.foliageMesh.setMatrixAt(instIdx, dummy.matrix);

        const col =
          foliagePalette[Math.floor(rand() * foliagePalette.length)];
        clusterColors[instIdx * 3] = col.r;
        clusterColors[instIdx * 3 + 1] = col.g;
        clusterColors[instIdx * 3 + 2] = col.b;
        clusterSeeds[instIdx] = rand();

        instIdx++;
      }
    });

    clusterGeo.setAttribute(
      'aClusterColor',
      new THREE.InstancedBufferAttribute(clusterColors, 3)
    );
    clusterGeo.setAttribute(
      'aClusterSeed',
      new THREE.InstancedBufferAttribute(clusterSeeds, 1)
    );
    this.foliageMesh.instanceMatrix.needsUpdate = true;
    this.foliageMesh.renderOrder = 1;
    this.rootGroup.add(this.foliageMesh);
  }

  /**
   * Builds volumetric cloud formations surrounding the roots in the cosmic abyss below,
   * drifting behind the colossal trunk, and crowning the upper canopy.
   */
  buildAtmosphericCloudLayers() {
    const THREE = window.THREE;
    this.cloudMeshes = [];

    const cloudFormations = [
      // Deep abyssal clouds around the spreading roots below (y = -5 to -24)
      { pos: [-12, -6.5, 2], scale: 16, col: '#0c1524', rim: '#2dd4bf', op: 0.42 },
      { pos: [12, -6.8, 2], scale: 16, col: '#0c1524', rim: '#38bdf8', op: 0.42 },
      { pos: [0, -8.5, -2], scale: 20, col: '#09111e', rim: '#fbbf24', op: 0.46 },
      { pos: [-18, -12.5, -6], scale: 24, col: '#0a1220', rim: '#2dd4bf', op: 0.50 },
      { pos: [18, -12.8, -6], scale: 24, col: '#0a1220', rim: '#f59e0b', op: 0.50 },
      { pos: [0, -16.5, -8], scale: 30, col: '#070d18', rim: '#38bdf8', op: 0.58 },
      { pos: [-10, -21.0, -4], scale: 28, col: '#060b14', rim: '#2dd4bf', op: 0.62 },
      { pos: [10, -21.0, -4], scale: 28, col: '#060b14', rim: '#fbbf24', op: 0.62 },

      // Distant horizon clouds flanking the colossal trunk
      { pos: [-26, 2.0, -18], scale: 24, col: '#111c2d', rim: '#fde68a', op: 0.36 },
      { pos: [26, 2.5, -18], scale: 24, col: '#111c2d', rim: '#67e8f9', op: 0.36 },
      { pos: [-34, 8.0, -22], scale: 28, col: '#131f33', rim: '#fbbf24', op: 0.38 },
      { pos: [34, 8.5, -22], scale: 28, col: '#131f33', rim: '#38bdf8', op: 0.38 },

      // High canopy mist where the uppermost branches disappear overhead (y = +18 to +30)
      { pos: [-14, 21.0, -12], scale: 22, col: '#162438', rim: '#fde68a', op: 0.36 },
      { pos: [14, 21.5, -12], scale: 22, col: '#162438', rim: '#6ee7b7', op: 0.36 },
      { pos: [0, 25.0, -14], scale: 28, col: '#18283e', rim: '#fef08a', op: 0.40 },
      { pos: [-8, 23.5, 4], scale: 20, col: '#152336', rim: '#67e8f9', op: 0.32 },
      { pos: [8, 24.0, 4], scale: 20, col: '#152336', rim: '#fde68a', op: 0.32 },
    ];

    const planeGeo = new THREE.PlaneGeometry(1, 1);

    cloudFormations.forEach((c, idx) => {
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uCloudColor: { value: new THREE.Color(c.col) },
          uRimColor: { value: new THREE.Color(c.rim) },
          uSeed: { value: idx * 3.17 + 1.1 },
          uOpacity: { value: c.op },
        },
        vertexShader: VOLUMETRIC_CLOUD_SHADER.vertexShader,
        fragmentShader: VOLUMETRIC_CLOUD_SHADER.fragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(planeGeo, mat);
      mesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
      mesh.scale.set(c.scale * 1.3, c.scale * 0.85, 1);
      // Tilt lower clouds slightly upward and upper clouds slightly downward toward the viewer
      if (c.pos[1] < -5) {
        mesh.rotation.x = -0.38;
      } else if (c.pos[1] > 16) {
        mesh.rotation.x = 0.42;
      }
      mesh.renderOrder = 2;
      this.rootGroup.add(mesh);
      this.cloudMeshes.push({
        mesh,
        mat,
        basePos: mesh.position.clone(),
        seed: idx,
      });
    });
  }

  /**
   * Builds a subtle field of floating cosmic embers and pollen motes drifting around the trunk,
   * roots, and overhead canopy.
   */
  buildCosmicParticleSystem() {
    const THREE = window.THREE;
    const rand = createSeededRandom(909);
    const count = 420;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const alphas = new Float32Array(count);

    const palette = [
      new THREE.Color('#fef08a'), // Warm golden pollen mote
      new THREE.Color('#fbd38d'), // Soft amber spark
      new THREE.Color('#6ee7b7'), // Forest bioluminescent mote
      new THREE.Color('#67e8f9'), // Ethereal cyan star-mote
    ];

    this.particleData = [];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = (rand() - 0.5) * 46;
      const y = -16 + rand() * 42;
      const z = 11 - rand() * 32;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      sizes[i] = 0.7 + Math.pow(rand(), 2.2) * 2.2;
      const c = palette[i % palette.length];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
      const baseAlpha = 0.18 + rand() * 0.52;
      alphas[i] = baseAlpha;

      this.particleData.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        phase: rand() * Math.PI * 2,
        speed: 0.12 + rand() * 0.28,
        baseAlpha,
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: this.renderer.getPixelRatio() },
      },
      vertexShader: PARTICLE_STREAM_SHADER.vertexShader,
      fragmentShader: PARTICLE_STREAM_SHADER.fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.cosmicParticles = new THREE.Points(geo, mat);
    this.cosmicParticles.renderOrder = 5;
    this.rootGroup.add(this.cosmicParticles);
  }

  resetView() {
    this.targetYaw = CAMERA_CONFIG.initialYaw;
    this.targetPitch = CAMERA_CONFIG.initialPitch;
  }

  lookInDirection(dYaw, dPitch) {
    const THREE = window.THREE;
    this.targetYaw = THREE.MathUtils.clamp(
      this.targetYaw + dYaw,
      -CAMERA_CONFIG.maxYaw,
      CAMERA_CONFIG.maxYaw
    );
    this.targetPitch = THREE.MathUtils.clamp(
      this.targetPitch + dPitch,
      CAMERA_CONFIG.minPitch,
      CAMERA_CONFIG.maxPitch
    );
  }

  bindEvents() {
    this._onResize = () => {
      if (this.disposed) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobile = w < 768 || w / h < 0.85;
      this.camera.fov = isMobile ? 64 : 54;
      this.camera.aspect = w / h;
      this.baseEyePos.z = isMobile
        ? CAMERA_CONFIG.eyePos[2] + 1.1
        : CAMERA_CONFIG.eyePos[2];
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    this._onPointerDown = (e) => {
      if (e.target.closest('button, a, [data-gateway-ui]')) return;
      this.isDragging = true;
      this.dragLast.x = e.clientX;
      this.dragLast.y = e.clientY;
      this.container.style.cursor = 'grabbing';
    };

    this._onPointerMove = (e) => {
      const THREE = window.THREE;
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.pointerNDC.x = (e.clientX / w) * 2 - 1;
      this.pointerNDC.y = -(e.clientY / h) * 2 + 1;

      if (this.isDragging) {
        const dx = e.clientX - this.dragLast.x;
        const dy = e.clientY - this.dragLast.y;
        this.dragLast.x = e.clientX;
        this.dragLast.y = e.clientY;

        this.targetYaw = THREE.MathUtils.clamp(
          this.targetYaw - dx * 0.0038,
          -CAMERA_CONFIG.maxYaw,
          CAMERA_CONFIG.maxYaw
        );
        this.targetPitch = THREE.MathUtils.clamp(
          this.targetPitch + dy * 0.0034,
          CAMERA_CONFIG.minPitch,
          CAMERA_CONFIG.maxPitch
        );
      }
    };

    this._onPointerUp = () => {
      this.isDragging = false;
      this.container.style.cursor = 'grab';
    };

    this._onWheel = (e) => {
      const THREE = window.THREE;
      // Smoothly tilt vertical look angle up into the canopy or down into the roots on scroll
      this.targetPitch = THREE.MathUtils.clamp(
        this.targetPitch - e.deltaY * 0.0009,
        CAMERA_CONFIG.minPitch,
        CAMERA_CONFIG.maxPitch
      );
    };

    window.addEventListener('resize', this._onResize);
    this.container.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove, {
      passive: true,
    });
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerUp);
    this.container.addEventListener('wheel', this._onWheel, { passive: true });
    this.container.style.cursor = 'grab';
  }

  startLoop() {
    const tick = () => {
      if (this.disposed) return;
      this.rafId = requestAnimationFrame(tick);
      if (document.hidden) return;
      this.update();
    };
    this.rafId = requestAnimationFrame(tick);
  }

  update() {
    const THREE = window.THREE;
    const rawDt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.reducedMotion ? 4.0 : this.clock.elapsedTime;
    const damp = 1 - Math.exp(-6.5 * (rawDt || 0.016));

    // 1. Genuine 3D Free-Look Camera Orientation (Up to overarching canopy, Down to roots, Left/Right around trunk)
    this.smoothPointer.lerp(this.pointerNDC, damp);
    this.yaw = THREE.MathUtils.lerp(this.yaw, this.targetYaw, damp);
    this.pitch = THREE.MathUtils.lerp(this.pitch, this.targetPitch, damp);

    const breatheX = this.reducedMotion ? 0 : Math.sin(elapsed * 0.25) * 0.16;
    const breatheY = this.reducedMotion ? 0 : Math.cos(elapsed * 0.2) * 0.1;

    // Subtle physical head-movement parallax combined with spherical look direction
    this.camera.position.set(
      this.baseEyePos.x + breatheX + this.smoothPointer.x * 0.45,
      this.baseEyePos.y + breatheY + this.smoothPointer.y * 0.3,
      this.baseEyePos.z
    );

    const effectiveYaw = this.yaw - this.smoothPointer.x * 0.14;
    const effectivePitch = THREE.MathUtils.clamp(
      this.pitch + this.smoothPointer.y * 0.12,
      -1.35,
      1.38
    );

    const cosP = Math.cos(effectivePitch);
    const sinP = Math.sin(effectivePitch);
    const sinY = Math.sin(effectiveYaw);
    const cosY = Math.cos(effectiveYaw);

    const lookDist = 25.0;
    const targetX = this.camera.position.x + sinY * cosP * lookDist;
    const targetY = this.camera.position.y + sinP * lookDist;
    const targetZ = this.camera.position.z - cosY * cosP * lookDist;
    this.camera.lookAt(targetX, targetY, targetZ);

    // 2. Update Void Dome, Ancient Bark Shader & Canopy Foliage Shader
    if (this.voidDomeMat) {
      this.voidDomeMat.uniforms.uTime.value = elapsed;
    }
    if (this.barkMaterial) {
      this.barkMaterial.uniforms.uTime.value = elapsed;
      this.barkMaterial.uniforms.uCameraPos.value.copy(this.camera.position);
    }
    if (this.foliageMaterial) {
      this.foliageMaterial.uniforms.uTime.value = elapsed;
      this.foliageMaterial.uniforms.uCameraPos.value.copy(this.camera.position);
    }

    // 3. Update Volumetric Cloud Layers
    for (let i = 0; i < this.cloudMeshes.length; i++) {
      const c = this.cloudMeshes[i];
      c.mat.uniforms.uTime.value = elapsed;
      if (!this.reducedMotion) {
        c.mesh.position.x =
          c.basePos.x + Math.sin(elapsed * 0.1 + c.seed) * 0.4;
        c.mesh.position.y =
          c.basePos.y + Math.cos(elapsed * 0.08 + c.seed) * 0.22;
      }
    }

    // 4. Update Floating Cosmic Particles
    if (this.cosmicParticles && !this.reducedMotion) {
      const posAttr = this.cosmicParticles.geometry.attributes.position;
      const alphaAttr = this.cosmicParticles.geometry.attributes.aAlpha;
      for (let i = 0; i < this.particleData.length; i++) {
        const d = this.particleData[i];
        const px = d.baseX + Math.sin(elapsed * d.speed + d.phase) * 0.55;
        const py =
          d.baseY + ((elapsed * d.speed * 0.75 + d.phase) % 5.0) - 2.5;
        posAttr.setXYZ(i, px, py, d.baseZ);
        alphaAttr.setX(
          i,
          d.baseAlpha * (0.65 + 0.35 * Math.sin(elapsed * 1.6 + d.phase))
        );
      }
      posAttr.needsUpdate = true;
      alphaAttr.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this._onResize);
    this.container.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerUp);
    this.container.removeEventListener('wheel', this._onWheel);
    if (this.barkTexture) {
      this.barkTexture.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
