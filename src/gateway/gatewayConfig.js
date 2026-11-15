// Visionexa '26 — The Infinite Cosmic Tree Environment Configuration
// Artistic foundation asset + multi-depth 3D parallax planes, volumetric clouds, and 3D energy strands

export const COSMIC_TREE_FOUNDATION_ASSET =
  '/assets/aistudio/Cosmic_Tree_of_Radiant_Light_c5503757.png';

// Multi-plane 3D depth shells surrounding the viewer (standing inside the dimension at Z = +6.5)
export const DEPTH_PLANES_CONFIG = [
  // 1. Far Deep Horizon Shell — vast enveloping background of infinite branches & cosmic nebula
  {
    id: 'far_horizon',
    z: -34.0,
    y: 0.0,
    x: 0.0,
    width: 96.0,
    height: 58.0,
    curveRadius: 52.0,
    dispHeight: 2.2,
    uvScale: [1.35, 1.35],
    uvOffset: [0.0, 0.0],
    lumaMin: 0.0,
    lumaMax: 1.0,
    opacity: 0.92,
    tint: [0.78, 0.88, 1.0],
    flowSpeed: 0.65,
    mirrorRepeat: true,
    blendMode: 'normal',
  },
  // 2. Upper Canopy Sky Dome — revealed when looking upward into the luminous clouds
  {
    id: 'upper_canopy_dome',
    z: -24.0,
    y: 13.5,
    x: 0.0,
    rotX: 0.42, // Tilted overhead toward the viewer standing below
    width: 68.0,
    height: 34.0,
    curveRadius: 38.0,
    dispHeight: 3.4,
    uvScale: [1.15, 0.72],
    uvOffset: [0.0, 0.24], // Samples upper canopy branches & clouds
    lumaMin: 0.08,
    lumaMax: 1.0,
    opacity: 0.88,
    tint: [0.95, 0.96, 1.05],
    flowSpeed: 0.85,
    mirrorRepeat: true,
    blendMode: 'additive_soft',
  },
  // 3. Lower Abyssal Root Cavern — revealed when looking downward into the mist and roots
  {
    id: 'lower_root_abyss',
    z: -22.0,
    y: -13.2,
    x: 0.0,
    rotX: -0.44, // Tilted below the viewer descending into the abyss
    width: 66.0,
    height: 34.0,
    curveRadius: 36.0,
    dispHeight: 3.6,
    uvScale: [1.15, -0.75], // Inverted Y weaves complex root arches plunging downward
    uvOffset: [0.0, 0.22],
    lumaMin: 0.06,
    lumaMax: 1.0,
    opacity: 0.86,
    tint: [0.85, 0.95, 0.92],
    flowSpeed: 0.75,
    mirrorRepeat: true,
    blendMode: 'additive_soft',
  },
  // 4. Left Peripheral Wing — revealed when looking left across endless interconnected branches
  {
    id: 'left_wing_canopy',
    z: -21.0,
    y: 0.5,
    x: -24.5,
    rotY: 0.46,
    width: 44.0,
    height: 40.0,
    curveRadius: 34.0,
    dispHeight: 3.2,
    uvScale: [-0.85, 1.05],
    uvOffset: [0.22, 0.0],
    lumaMin: 0.08,
    lumaMax: 1.0,
    opacity: 0.82,
    tint: [0.92, 0.96, 1.0],
    flowSpeed: 0.9,
    mirrorRepeat: true,
    blendMode: 'additive_soft',
  },
  // 5. Right Peripheral Wing — revealed when looking right across endless interconnected branches
  {
    id: 'right_wing_canopy',
    z: -21.0,
    y: -0.5,
    x: 24.5,
    rotY: -0.46,
    width: 44.0,
    height: 40.0,
    curveRadius: 34.0,
    dispHeight: 3.2,
    uvScale: [-0.85, 1.05],
    uvOffset: [-0.22, 0.0],
    lumaMin: 0.08,
    lumaMax: 1.0,
    opacity: 0.82,
    tint: [0.98, 0.94, 0.96],
    flowSpeed: 0.9,
    mirrorRepeat: true,
    blendMode: 'additive_soft',
  },
  // 6. Primary Hero Sanctuary Shell — high-resolution 3D luminance-displaced centerpiece
  {
    id: 'hero_sanctuary_core',
    z: -16.5,
    y: 0.0,
    x: 0.0,
    width: 46.0,
    height: 27.5,
    curveRadius: 28.0,
    dispHeight: 4.4, // Strong 3D relief extrusion on the intertwined energy boughs
    uvScale: [1.0, 1.0],
    uvOffset: [0.0, 0.0],
    lumaMin: 0.02,
    lumaMax: 1.0,
    opacity: 0.98,
    tint: [1.0, 1.0, 1.0],
    flowSpeed: 1.0,
    mirrorRepeat: false,
    blendMode: 'normal',
  },
  // 7. Mid-Foreground Luminous Strand Layer — extracts bright golden/cyan energy strands at z = -11.5 for strong parallax
  {
    id: 'foreground_strands_relief',
    z: -11.5,
    y: -0.4,
    x: 0.0,
    width: 38.0,
    height: 23.0,
    curveRadius: 22.0,
    dispHeight: 3.8,
    uvScale: [0.96, 0.96],
    uvOffset: [0.0, -0.02],
    lumaMin: 0.42, // Only slices the luminous energy strands & root arches!
    lumaMax: 1.0,
    opacity: 0.62,
    tint: [1.06, 1.02, 0.96],
    flowSpeed: 1.35,
    mirrorRepeat: false,
    blendMode: 'additive',
  },
  // 8. Near-Camera Peripheral Canopy & Root Frame — subtle close parallax at z = -7.5
  {
    id: 'near_frame_strands',
    z: -7.5,
    y: -1.2,
    x: 0.0,
    width: 34.0,
    height: 21.0,
    curveRadius: 17.5,
    dispHeight: 2.6,
    uvScale: [0.88, 0.88],
    uvOffset: [0.0, -0.04],
    lumaMin: 0.54,
    lumaMax: 1.0,
    opacity: 0.35,
    tint: [1.08, 1.0, 0.92],
    flowSpeed: 1.6,
    mirrorRepeat: false,
    blendMode: 'additive',
    edgeVignetteHole: true, // Leaves center open while framing the peripheral foreground with parallax strands
  },
];

// 3D Intertwined Energy Filaments that bridge across depth planes in true 3D space
export const SPATIAL_ENERGY_FILAMENTS = [
  // Sweeping lower foreground root arch (matches the dramatic lower-left arch in the reference image)
  {
    points: [
      [-14.5, -5.8, -8.5],
      [-8.2, -3.6, -9.2],
      [-3.8, -1.8, -10.5],
      [-0.6, -2.8, -11.8],
      [2.8, -6.5, -10.2],
      [6.4, -10.8, -9.0],
    ],
    radius: 0.065,
    colorA: '#fef08a',
    colorB: '#38bdf8',
    speed: 1.2,
  },
  // Secondary root strand weaving under the arch
  {
    points: [
      [-12.0, -7.2, -9.5],
      [-6.5, -4.2, -10.0],
      [-2.2, -3.4, -11.2],
      [-0.8, -6.8, -12.0],
      [-2.4, -11.5, -13.5],
    ],
    radius: 0.05,
    colorA: '#fde047',
    colorB: '#34d399',
    speed: 0.95,
  },
  // Right descending root cascade
  {
    points: [
      [-0.2, -0.8, -13.2],
      [1.8, -2.6, -11.8],
      [5.4, -4.8, -10.5],
      [10.5, -7.4, -9.2],
      [16.2, -9.8, -8.0],
    ],
    radius: 0.06,
    colorA: '#fef9c3',
    colorB: '#2dd4bf',
    speed: 1.1,
  },
  // Central twisting nexus ascender 1
  {
    points: [
      [-1.4, -3.2, -12.5],
      [0.4, -0.5, -13.0],
      [1.2, 2.2, -13.2],
      [-0.6, 5.0, -12.4],
      [-3.8, 8.2, -11.0],
      [-8.5, 12.0, -9.5],
    ],
    radius: 0.06,
    colorA: '#fef08a',
    colorB: '#67e8f9',
    speed: 1.3,
  },
  // Central twisting nexus ascender 2
  {
    points: [
      [1.6, -2.8, -12.8],
      [-0.2, 0.2, -13.4],
      [1.8, 2.8, -12.6],
      [5.2, 5.4, -11.4],
      [9.8, 8.6, -10.0],
      [15.4, 12.2, -8.8],
    ],
    radius: 0.055,
    colorA: '#fde68a',
    colorB: '#a5b4fc',
    speed: 1.15,
  },
  // Left sweeping upper-mid bough
  {
    points: [
      [0.2, 0.8, -13.5],
      [-3.5, 1.8, -12.2],
      [-8.4, 2.6, -10.8],
      [-14.2, 4.4, -9.4],
      [-20.5, 7.2, -8.2],
    ],
    radius: 0.052,
    colorA: '#67e8f9',
    colorB: '#fde047',
    speed: 1.05,
  },
  // Left lower-mid horizontal stream
  {
    points: [
      [-0.8, -0.6, -13.2],
      [-5.2, -0.2, -11.8],
      [-10.6, 0.8, -10.2],
      [-16.8, 2.8, -8.8],
    ],
    radius: 0.045,
    colorA: '#fde047',
    colorB: '#34d399',
    speed: 1.25,
  },
  // Right sweeping upper canopy bough
  {
    points: [
      [0.8, 1.2, -13.2],
      [4.8, 2.4, -12.0],
      [9.6, 4.2, -10.6],
      [15.2, 6.8, -9.2],
      [21.0, 9.8, -8.0],
    ],
    radius: 0.055,
    colorA: '#fef08a',
    colorB: '#38bdf8',
    speed: 1.18,
  },
  // Right mid-lower filament
  {
    points: [
      [1.2, -0.4, -13.0],
      [5.8, 0.4, -11.6],
      [11.4, -0.6, -10.2],
      [17.5, -2.4, -8.8],
    ],
    radius: 0.045,
    colorA: '#6ee7b7',
    colorB: '#fef08a',
    speed: 1.0,
  },
  // High overhead canopy bridge (visible when looking up)
  {
    points: [
      [-12.5, 9.5, -14.0],
      [-5.2, 7.8, -15.2],
      [0.5, 8.4, -15.8],
      [6.4, 10.2, -14.6],
      [13.5, 13.0, -13.0],
    ],
    radius: 0.05,
    colorA: '#a5f3fc',
    colorB: '#fde047',
    speed: 0.9,
  },
  // Deep abyssal root bridge (visible when looking down)
  {
    points: [
      [-11.5, -9.2, -13.5],
      [-4.8, -7.8, -14.8],
      [0.6, -8.5, -15.2],
      [5.8, -10.4, -14.0],
      [12.2, -12.8, -12.5],
    ],
    radius: 0.05,
    colorA: '#34d399',
    colorB: '#fde047',
    speed: 0.85,
  },
];
