// Visionexa '26 — The Infinite Cosmic Tree 3D Environment (Three.js r128)
import {
  COSMIC_TREE_FOUNDATION_ASSET,
  DEPTH_PLANES_CONFIG,
  SPATIAL_ENERGY_FILAMENTS,
} from './gatewayConfig.js';
import {
  INFINITE_VOID_DOME_SHADER,
  COSMIC_TREE_DEPTH_SHADER,
  VOLUMETRIC_CLOUD_SHADER,
  LIVING_FILAMENT_SHADER,
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
    this.depthPlaneMaterials = [];
    this.cloudMeshes = [];
    this.filamentMaterials = [];
    this.cosmicParticles = null;
    this.particleData = [];

    // Interactive camera look-around state (Up, Down, Left, Right + 3D Parallax translation)
    this.pointerNDC = new window.THREE.Vector2(0, 0);
    this.smoothPointer = new window.THREE.Vector2(0, 0);
    this.dragYaw = 0;
    this.dragPitch = 0;
    this.targetDragYaw = 0;
    this.targetDragPitch = 0;
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
      isMobile ? 62 : 52,
      w / h,
      0.1,
      250
    );
    this.baseCamZ = isMobile ? 7.4 : 6.2;
    this.camera.position.set(0, 0, this.baseCamZ);

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
    this.renderer.setClearColor(0x04060d, 1);
    if (THREE.sRGBEncoding) {
      this.renderer.outputEncoding = THREE.sRGBEncoding;
    }

    this.renderer.domElement.className = 'gateway-canvas';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.container.appendChild(this.renderer.domElement);

    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this.buildInfiniteVoidDome();
    this.buildDepthPlanes();
    this.buildAtmosphericCloudLayers();
    this.buildSpatialEnergyFilaments();
    this.buildCosmicParticleSystem();
    this.loadFoundationArtwork();

    this.bindEvents();
    this.startLoop();
  }

  loadFoundationArtwork() {
    const THREE = window.THREE;
    const loader = new THREE.TextureLoader();
    loader.load(
      COSMIC_TREE_FOUNDATION_ASSET,
      (tex) => {
        if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = Math.min(
          8,
          this.renderer.capabilities.getMaxAnisotropy()
        );
        tex.needsUpdate = true;

        this.depthPlaneMaterials.forEach((mat) => {
          mat.uniforms.uMap.value = tex;
          mat.uniforms.uHasMap.value = 1.0;
        });
      },
      undefined,
      (err) => {
        console.error('Failed to load cosmic tree foundation texture:', err);
      }
    );
  }

  buildInfiniteVoidDome() {
    const THREE = window.THREE;
    const geo = new THREE.SphereGeometry(120, 48, 36);
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
   * Builds 8 concentric 3D luminance-displaced depth shells from z = -34 to z = -7.5
   * so the visitor stands inside a multi-layered 3D cosmic tree with real parallax
   * and continuous upper canopy, lower root abyss, and peripheral branches.
   */
  buildDepthPlanes() {
    const THREE = window.THREE;
    this.depthPlaneMaterials = [];

    DEPTH_PLANES_CONFIG.forEach((cfg, index) => {
      // High vertex density so luminance 3D relief extrusion sculpts individual boughs and root arches smoothly
      const segsX = cfg.id === 'hero_sanctuary_core' ? 160 : 96;
      const segsY = cfg.id === 'hero_sanctuary_core' ? 100 : 64;
      const geo = new THREE.PlaneGeometry(cfg.width, cfg.height, segsX, segsY);

      const blending =
        cfg.blendMode === 'additive'
          ? THREE.AdditiveBlending
          : THREE.NormalBlending;

      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: null },
          uHasMap: { value: 0.0 },
          uTime: { value: 0.0 },
          uCurveRadius: { value: cfg.curveRadius },
          uDispHeight: { value: cfg.dispHeight },
          uUvScale: { value: new THREE.Vector2(cfg.uvScale[0], cfg.uvScale[1]) },
          uUvOffset: {
            value: new THREE.Vector2(cfg.uvOffset[0], cfg.uvOffset[1]),
          },
          uLumaMin: { value: cfg.lumaMin },
          uLumaMax: { value: cfg.lumaMax },
          uOpacity: { value: cfg.opacity },
          uTint: {
            value: new THREE.Vector3(cfg.tint[0], cfg.tint[1], cfg.tint[2]),
          },
          uFlowSpeed: { value: cfg.flowSpeed },
          uMirrorRepeat: { value: cfg.mirrorRepeat ? 1.0 : 0.0 },
          uEdgeVignetteHole: { value: cfg.edgeVignetteHole ? 1.0 : 0.0 },
        },
        vertexShader: COSMIC_TREE_DEPTH_SHADER.vertexShader,
        fragmentShader: COSMIC_TREE_DEPTH_SHADER.fragmentShader,
        transparent: true,
        depthWrite: false,
        blending,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      if (cfg.rotX) mesh.rotation.x = cfg.rotX;
      if (cfg.rotY) mesh.rotation.y = cfg.rotY;
      mesh.renderOrder = -20 + index * 2;

      this.rootGroup.add(mesh);
      this.depthPlaneMaterials.push(mat);
    });
  }

  /**
   * Builds 36 volumetric cloud layers positioned across 3D depths:
   * - Overhead canopy clouds (where ascending branches vanish into luminous mist)
   * - Deep abyssal storm clouds (where descending roots disappear into darkness and mist)
   * - Left & right peripheral cloud banks (creating deep parallax when looking sideways)
   */
  buildAtmosphericCloudLayers() {
    const THREE = window.THREE;
    this.cloudMeshes = [];

    const cloudFormations = [
      // Overhead luminous canopy cloud bank (y = +8 to +18)
      { pos: [-14, 10.5, -19], scale: 16, col: '#1e2638', rim: '#fde68a', op: 0.42 },
      { pos: [-5, 12.2, -17], scale: 15, col: '#1a2736', rim: '#67e8f9', op: 0.38 },
      { pos: [6, 11.8, -18], scale: 16, col: '#22253a', rim: '#fef08a', op: 0.40 },
      { pos: [15, 10.2, -19], scale: 16, col: '#1f2438', rim: '#f9a8d4', op: 0.42 },
      { pos: [0, 15.5, -22], scale: 22, col: '#151c2c', rim: '#bae6fd', op: 0.48 },
      { pos: [-11, 14.8, -23], scale: 20, col: '#161f30', rim: '#fef08a', op: 0.45 },
      { pos: [11, 14.5, -23], scale: 20, col: '#181e32', rim: '#6ee7b7', op: 0.45 },

      // Deep abyssal root mist & dark storm clouds (y = -8 to -18)
      { pos: [-15, -9.8, -16], scale: 16, col: '#141926', rim: '#fbbf24', op: 0.48 },
      { pos: [-5, -11.5, -15], scale: 14, col: '#121824', rim: '#34d399', op: 0.42 },
      { pos: [5, -11.2, -16], scale: 15, col: '#151928', rim: '#fde047', op: 0.44 },
      { pos: [15, -9.5, -15], scale: 16, col: '#171b2a', rim: '#fb923c', op: 0.48 },
      { pos: [0, -15.2, -20], scale: 24, col: '#0c101b', rim: '#38bdf8', op: 0.56 },
      { pos: [-11, -14.5, -21], scale: 21, col: '#0e1320', rim: '#fbbf24', op: 0.52 },
      { pos: [11, -14.8, -21], scale: 21, col: '#0e1320', rim: '#2dd4bf', op: 0.52 },

      // Left & right foreground/midground atmospheric cloud banks (strong lateral parallax)
      { pos: [-19, 3.5, -13], scale: 14, col: '#1b2234', rim: '#fde68a', op: 0.36 },
      { pos: [-21, -3.2, -12], scale: 15, col: '#171d2e', rim: '#fbbf24', op: 0.40 },
      { pos: [19, 2.8, -13], scale: 14, col: '#1d2236', rim: '#67e8f9', op: 0.36 },
      { pos: [21, -3.6, -12], scale: 15, col: '#191d2e', rim: '#f472b6', op: 0.40 },
      { pos: [-28, 0.0, -18], scale: 22, col: '#141a29', rim: '#fde047', op: 0.44 },
      { pos: [28, 0.0, -18], scale: 22, col: '#141a29', rim: '#67e8f9', op: 0.44 },
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
      mesh.scale.set(c.scale * 1.25, c.scale * 0.85, 1);
      mesh.renderOrder = -3;
      this.rootGroup.add(mesh);
      this.cloudMeshes.push({ mesh, mat, basePos: mesh.position.clone(), seed: idx });
    });
  }

  /**
   * Builds subtle 3D intertwined energy strands that weave between the depth planes,
   * fusing the displaced artwork shells with true 3D spatial filaments.
   */
  buildSpatialEnergyFilaments() {
    const THREE = window.THREE;
    this.filamentMaterials = [];

    SPATIAL_ENERGY_FILAMENTS.forEach((f) => {
      const curve = new THREE.CatmullRomCurve3(
        f.points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
      );
      const geo = new THREE.TubeGeometry(curve, 72, f.radius, 8, false);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColorA: { value: new THREE.Color(f.colorA) },
          uColorB: { value: new THREE.Color(f.colorB) },
          uSpeed: { value: f.speed },
        },
        vertexShader: LIVING_FILAMENT_SHADER.vertexShader,
        fragmentShader: LIVING_FILAMENT_SHADER.fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 2;
      this.rootGroup.add(mesh);
      this.filamentMaterials.push(mat);
    });
  }

  /**
   * Builds a 650-particle multi-depth cosmic spark and timeline mote field
   * surrounding the viewer in all directions.
   */
  buildCosmicParticleSystem() {
    const THREE = window.THREE;
    const count = 650;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const alphas = new Float32Array(count);

    const palette = [
      new THREE.Color('#fef08a'), // Radiant gold
      new THREE.Color('#fde047'), // Warm amber-gold
      new THREE.Color('#67e8f9'), // Ethereal cyan
      new THREE.Color('#6ee7b7'), // Bioluminescent emerald
      new THREE.Color('#e0f2fe'), // Starlight silver
    ];

    this.particleData = [];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * 54;
      const y = (Math.random() - 0.5) * 38;
      const z = -4 - Math.random() * 26;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      sizes[i] = 0.8 + Math.pow(Math.random(), 2.2) * 2.8;
      const c = palette[i % palette.length];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
      const baseAlpha = 0.22 + Math.random() * 0.65;
      alphas[i] = baseAlpha;

      this.particleData.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        phase: Math.random() * Math.PI * 2,
        speed: 0.15 + Math.random() * 0.35,
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
    this.targetDragYaw = 0;
    this.targetDragPitch = 0;
  }

  lookInDirection(dYaw, dPitch) {
    const THREE = window.THREE;
    this.targetDragYaw = THREE.MathUtils.clamp(
      this.targetDragYaw + dYaw,
      -0.62,
      0.62
    );
    this.targetDragPitch = THREE.MathUtils.clamp(
      this.targetDragPitch + dPitch,
      -0.48,
      0.48
    );
  }

  bindEvents() {
    this._onResize = () => {
      if (this.disposed) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobile = w < 768 || w / h < 0.85;
      this.camera.fov = isMobile ? 62 : 52;
      this.camera.aspect = w / h;
      this.baseCamZ = isMobile ? 7.4 : 6.2;
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

        this.targetDragYaw = THREE.MathUtils.clamp(
          this.targetDragYaw + dx * 0.0028,
          -0.62,
          0.62
        );
        this.targetDragPitch = THREE.MathUtils.clamp(
          this.targetDragPitch + dy * 0.0025,
          -0.48,
          0.48
        );
      }
    };

    this._onPointerUp = () => {
      this.isDragging = false;
      this.container.style.cursor = 'grab';
    };

    window.addEventListener('resize', this._onResize);
    this.container.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove, {
      passive: true,
    });
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerUp);
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
    const damp = 1 - Math.exp(-6.0 * (rawDt || 0.016));

    // 1. Smooth Camera Look-Around (Up into canopy clouds, Down into root abyss, Left/Right into branches)
    this.smoothPointer.lerp(this.pointerNDC, damp);
    this.dragYaw = THREE.MathUtils.lerp(
      this.dragYaw,
      this.targetDragYaw,
      damp
    );
    this.dragPitch = THREE.MathUtils.lerp(
      this.dragPitch,
      this.targetDragPitch,
      damp
    );

    const ambientX = this.reducedMotion ? 0 : Math.sin(elapsed * 0.22) * 0.45;
    const ambientY = this.reducedMotion ? 0 : Math.cos(elapsed * 0.17) * 0.32;
    const ambientZ = this.reducedMotion ? 0 : Math.sin(elapsed * 0.14) * 0.35;

    // Combine pointer hover parallax + drag look-around for both camera position and look angle
    const lookYaw = this.dragYaw - this.smoothPointer.x * 0.22;
    const lookPitch = this.dragPitch + this.smoothPointer.y * 0.18;

    this.camera.position.x =
      ambientX + this.smoothPointer.x * 1.45 - this.dragYaw * 3.2;
    this.camera.position.y =
      ambientY + this.smoothPointer.y * 1.05 + this.dragPitch * 2.6;
    this.camera.position.z = this.baseCamZ + ambientZ;

    // Aim camera along the combined yaw/pitch direction into the infinite tree
    const lookDist = 18.0;
    const targetX =
      this.camera.position.x * 0.35 - Math.sin(lookYaw) * lookDist;
    const targetY =
      this.camera.position.y * 0.35 + Math.sin(lookPitch) * lookDist * 0.85;
    const targetZ = -16.0;
    this.camera.lookAt(targetX, targetY, targetZ);

    // 2. Update Void Dome & Multi-Depth Shells
    if (this.voidDomeMat) {
      this.voidDomeMat.uniforms.uTime.value = elapsed;
    }
    for (let i = 0; i < this.depthPlaneMaterials.length; i++) {
      this.depthPlaneMaterials[i].uniforms.uTime.value = elapsed;
    }

    // 3. Update Volumetric Cloud Billboards
    for (let i = 0; i < this.cloudMeshes.length; i++) {
      const c = this.cloudMeshes[i];
      c.mat.uniforms.uTime.value = elapsed;
      if (!this.reducedMotion) {
        c.mesh.position.x =
          c.basePos.x + Math.sin(elapsed * 0.12 + c.seed) * 0.45;
        c.mesh.position.y =
          c.basePos.y + Math.cos(elapsed * 0.1 + c.seed) * 0.28;
      }
    }

    // 4. Update 3D Spatial Energy Filaments
    for (let i = 0; i < this.filamentMaterials.length; i++) {
      this.filamentMaterials[i].uniforms.uTime.value = elapsed;
    }

    // 5. Update Floating Cosmic Particles
    if (this.cosmicParticles && !this.reducedMotion) {
      const posAttr = this.cosmicParticles.geometry.attributes.position;
      const alphaAttr = this.cosmicParticles.geometry.attributes.aAlpha;
      for (let i = 0; i < this.particleData.length; i++) {
        const d = this.particleData[i];
        const px = d.baseX + Math.sin(elapsed * d.speed + d.phase) * 0.65;
        const py =
          d.baseY +
          ((elapsed * d.speed * 0.8 + d.phase) % 6.0) -
          3.0;
        posAttr.setXYZ(i, px, py, d.baseZ);
        alphaAttr.setX(
          i,
          d.baseAlpha * (0.65 + 0.35 * Math.sin(elapsed * 1.8 + d.phase))
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
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
