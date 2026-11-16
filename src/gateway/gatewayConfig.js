// Visionexa '26 — Giant Ancient Cosmic Tree Procedural Configuration
// Defines the organic trunk, primary boughs, secondary/tertiary branch generation parameters,
// spreading buttress roots, overhead canopy foliage clusters, and atmospheric cloud banks.

// Deterministic pseudo-random generator for reproducible organic branching
export function createSeededRandom(seed = 42) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function next() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Camera positioned at human eye level, close in front of the colossal trunk
export const CAMERA_CONFIG = {
  eyePos: [0.0, 1.65, 6.8],
  initialPitch: 0.14, // Slightly looking up at the monumental trunk & lower crown
  initialYaw: 0.0,
  minPitch: -1.18, // Look down (-68 deg) into the spreading roots and abyssal clouds
  maxPitch: 1.26, // Look up (+72 deg) into the overarching branch canopy
  maxYaw: 2.05, // Look left/right (±117 deg) around the colossal trunk and flanking boughs
};

// 1. THE COLOSSAL CENTRAL TRUNK
// Positioned directly in front of the visitor (center at z = -4.6, front bark face at z ≈ -1.4,
// only ~8 units from the visitor's eyes, spanning over 6.5 units wide at the flared base).
export const TRUNK_SPINE = {
  points: [
    [0.0, -7.5, -5.0],
    [0.12, -4.2, -4.7],
    [-0.08, -1.2, -4.5],
    [-0.18, 2.0, -4.4],
    [0.05, 5.2, -4.5],
    [0.22, 8.4, -4.7],
    [0.08, 11.6, -5.0],
    [-0.1, 14.5, -5.4],
  ],
  radiusStart: 4.35,
  radiusEnd: 1.85,
  taperPower: 0.82,
  buttressCount: 7,
  buttressStrength: 0.36, // Deep muscular root-buttress flutes at the base of the trunk
  barkFlutes: 11,
  fluteDepth: 0.12,
  knotStrength: 0.14,
  twistTurns: 0.38,
  tubularSegments: 64,
  radialSegments: 36,
  energyVeinWeight: 1.0,
};

// 2. MASSIVE PRIMARY BOUGHS (Thick limbs splitting naturally from the upper trunk between y = 6.2 and y = 14.2)
// Several boughs arch high overhead (z > 0, even reaching z = +8 above/behind the visitor)
// so looking straight up reveals an overarching cathedral of branches.
export const PRIMARY_BOUGHS = [
  // 1. Great West-Front Overarching Bough (sweeps left and forward overhead)
  {
    points: [
      [-0.8, 7.2, -4.4],
      [-3.6, 8.8, -2.5],
      [-7.4, 11.2, 0.2],
      [-12.2, 13.8, 2.8],
      [-17.5, 16.5, 4.6],
      [-22.8, 19.0, 5.8],
    ],
    radiusStart: 1.52,
    radiusEnd: 0.36,
    taperPower: 0.88,
    barkFlutes: 8,
    fluteDepth: 0.09,
    twistTurns: 0.25,
    energyVeinWeight: 0.9,
  },
  // 2. Great East-Front Overarching Bough (sweeps right and forward overhead)
  {
    points: [
      [0.85, 7.6, -4.4],
      [3.8, 9.4, -2.2],
      [7.8, 11.8, 0.5],
      [12.6, 14.4, 3.0],
      [18.0, 17.2, 4.8],
      [23.2, 19.8, 6.0],
    ],
    radiusStart: 1.48,
    radiusEnd: 0.35,
    taperPower: 0.88,
    barkFlutes: 8,
    fluteDepth: 0.09,
    twistTurns: -0.25,
    energyVeinWeight: 0.9,
  },
  // 3. Central Overhead Cathedral Arch (reaches directly toward & above the visitor's head!)
  {
    points: [
      [-0.15, 9.2, -4.3],
      [-0.6, 11.8, -1.2],
      [-1.2, 14.6, 2.4],
      [-1.8, 17.4, 6.2],
      [-2.4, 20.2, 9.8],
    ],
    radiusStart: 1.28,
    radiusEnd: 0.28,
    taperPower: 0.9,
    barkFlutes: 7,
    fluteDepth: 0.08,
    twistTurns: 0.2,
    energyVeinWeight: 0.85,
  },
  // 4. High East Overhead Crown Bough
  {
    points: [
      [0.4, 10.6, -4.5],
      [2.6, 13.4, -1.8],
      [5.4, 16.5, 1.4],
      [8.6, 19.6, 4.5],
      [12.2, 22.4, 7.2],
    ],
    radiusStart: 1.22,
    radiusEnd: 0.26,
    taperPower: 0.9,
    barkFlutes: 7,
    fluteDepth: 0.08,
    twistTurns: -0.2,
    energyVeinWeight: 0.8,
  },
  // 5. Massive West Lateral Bough (extends wide to the left horizon)
  {
    points: [
      [-1.1, 8.4, -4.8],
      [-5.2, 10.2, -5.4],
      [-10.5, 12.8, -6.2],
      [-16.4, 15.8, -7.2],
      [-22.8, 19.2, -8.5],
      [-28.5, 22.5, -10.0],
    ],
    radiusStart: 1.58,
    radiusEnd: 0.38,
    taperPower: 0.86,
    barkFlutes: 8,
    fluteDepth: 0.1,
    twistTurns: 0.3,
    energyVeinWeight: 0.95,
  },
  // 6. Massive East Lateral Bough (extends wide to the right horizon)
  {
    points: [
      [1.15, 8.8, -4.8],
      [5.4, 10.6, -5.2],
      [10.8, 13.2, -6.0],
      [16.8, 16.2, -7.0],
      [23.2, 19.6, -8.2],
      [29.0, 23.0, -9.8],
    ],
    radiusStart: 1.55,
    radiusEnd: 0.38,
    taperPower: 0.86,
    barkFlutes: 8,
    fluteDepth: 0.1,
    twistTurns: -0.3,
    energyVeinWeight: 0.95,
  },
  // 7. Deep Northwest Crown Leader
  {
    points: [
      [-0.6, 12.2, -5.1],
      [-3.8, 15.4, -7.2],
      [-7.8, 19.2, -9.8],
      [-12.5, 23.4, -12.6],
      [-17.2, 27.5, -15.5],
    ],
    radiusStart: 1.38,
    radiusEnd: 0.32,
    taperPower: 0.88,
    barkFlutes: 7,
    fluteDepth: 0.08,
    twistTurns: 0.22,
    energyVeinWeight: 0.75,
  },
  // 8. Deep Northeast Crown Leader
  {
    points: [
      [0.5, 12.6, -5.1],
      [3.6, 15.8, -7.4],
      [7.6, 19.6, -10.0],
      [12.2, 23.8, -12.8],
      [16.8, 28.0, -15.8],
    ],
    radiusStart: 1.35,
    radiusEnd: 0.32,
    taperPower: 0.88,
    barkFlutes: 7,
    fluteDepth: 0.08,
    twistTurns: -0.22,
    energyVeinWeight: 0.75,
  },
  // 9. Lower-Mid Gnarled West Shoulder Limb
  {
    points: [
      [-1.3, 5.8, -4.6],
      [-4.8, 6.4, -3.6],
      [-9.2, 7.6, -2.4],
      [-14.2, 9.4, -1.2],
      [-19.0, 11.8, 0.2],
    ],
    radiusStart: 1.15,
    radiusEnd: 0.25,
    taperPower: 0.9,
    barkFlutes: 6,
    fluteDepth: 0.08,
    twistTurns: 0.18,
    energyVeinWeight: 0.7,
  },
  // 10. Lower-Mid Gnarled East Shoulder Limb
  {
    points: [
      [1.35, 6.1, -4.6],
      [4.9, 6.8, -3.4],
      [9.4, 8.2, -2.0],
      [14.5, 10.0, -0.6],
      [19.4, 12.5, 0.8],
    ],
    radiusStart: 1.12,
    radiusEnd: 0.25,
    taperPower: 0.9,
    barkFlutes: 6,
    fluteDepth: 0.08,
    twistTurns: -0.18,
    energyVeinWeight: 0.7,
  },
];

// 3. GIANT SPREADING ROOTS
// Emerge from the flared base of the trunk (y = +0.4 down to -6.5), spreading outward
// around the visitor's vantage point and plunging into the abyssal clouds below.
export const PRIMARY_ROOTS = [
  // 1. Foreground Left Root Arch (passes right beside & below the visitor on the left!)
  {
    points: [
      [-1.8, -0.4, -2.8],
      [-2.8, -0.8, 0.6],
      [-3.4, -0.5, 3.8],
      [-4.6, -1.6, 6.8],
      [-6.8, -4.5, 9.6],
      [-9.5, -9.8, 11.8],
    ],
    radiusStart: 1.65,
    radiusEnd: 0.28,
    taperPower: 0.82,
    barkFlutes: 7,
    fluteDepth: 0.1,
    twistTurns: 0.22,
    energyVeinWeight: 0.95,
  },
  // 2. Foreground Right Root Arch (passes right beside & below the visitor on the right!)
  {
    points: [
      [1.85, -0.3, -2.8],
      [2.9, -0.7, 0.8],
      [3.6, -0.4, 4.0],
      [4.8, -1.5, 7.0],
      [7.0, -4.4, 9.8],
      [9.8, -9.6, 12.0],
    ],
    radiusStart: 1.62,
    radiusEnd: 0.28,
    taperPower: 0.82,
    barkFlutes: 7,
    fluteDepth: 0.1,
    twistTurns: -0.22,
    energyVeinWeight: 0.95,
  },
  // 3. Underfoot Sanctuary Root Bridge (grounds the visitor at z = 6.8 so they stand on/beside a massive root)
  {
    points: [
      [-0.4, -1.2, -2.4],
      [-0.8, -1.6, 1.2],
      [-0.3, -1.1, 4.4],
      [0.4, -0.85, 6.8],
      [1.6, -1.9, 9.2],
      [3.4, -5.8, 11.5],
    ],
    radiusStart: 1.38,
    radiusEnd: 0.26,
    taperPower: 0.85,
    barkFlutes: 6,
    fluteDepth: 0.09,
    twistTurns: 0.15,
    energyVeinWeight: 0.85,
  },
  // 4. Secondary Underfoot Intertwined Root
  {
    points: [
      [0.6, -1.4, -2.5],
      [1.1, -1.8, 1.0],
      [0.5, -1.25, 4.2],
      [-0.5, -0.95, 6.7],
      [-1.8, -2.2, 9.4],
      [-3.8, -6.4, 11.6],
    ],
    radiusStart: 1.18,
    radiusEnd: 0.22,
    taperPower: 0.86,
    barkFlutes: 6,
    fluteDepth: 0.08,
    twistTurns: -0.18,
    energyVeinWeight: 0.8,
  },
  // 5. Great West Buttress Root (sweeps wide left and plunges into the abyss)
  {
    points: [
      [-2.8, -0.6, -4.2],
      [-6.2, -2.2, -2.8],
      [-10.6, -4.8, -1.2],
      [-15.4, -8.8, 0.4],
      [-20.2, -14.5, 1.8],
      [-24.5, -21.5, 3.0],
    ],
    radiusStart: 1.85,
    radiusEnd: 0.32,
    taperPower: 0.8,
    barkFlutes: 8,
    fluteDepth: 0.11,
    twistTurns: 0.28,
    energyVeinWeight: 0.9,
  },
  // 6. Great East Buttress Root (sweeps wide right and plunges into the abyss)
  {
    points: [
      [2.85, -0.5, -4.2],
      [6.4, -2.1, -2.6],
      [10.8, -4.6, -1.0],
      [15.8, -8.6, 0.6],
      [20.6, -14.2, 2.0],
      [25.0, -21.2, 3.2],
    ],
    radiusStart: 1.82,
    radiusEnd: 0.32,
    taperPower: 0.8,
    barkFlutes: 8,
    fluteDepth: 0.11,
    twistTurns: -0.28,
    energyVeinWeight: 0.9,
  },
  // 7. Mid-West Spreading Root
  {
    points: [
      [-2.2, -1.8, -3.5],
      [-5.4, -3.8, -0.4],
      [-8.8, -7.2, 2.5],
      [-12.6, -12.4, 5.2],
      [-16.2, -19.0, 7.5],
    ],
    radiusStart: 1.42,
    radiusEnd: 0.24,
    taperPower: 0.85,
    barkFlutes: 6,
    fluteDepth: 0.09,
    twistTurns: 0.2,
    energyVeinWeight: 0.75,
  },
  // 8. Mid-East Spreading Root
  {
    points: [
      [2.25, -1.7, -3.5],
      [5.5, -3.6, -0.2],
      [9.0, -7.0, 2.6],
      [12.8, -12.2, 5.4],
      [16.5, -18.8, 7.6],
    ],
    radiusStart: 1.4,
    radiusEnd: 0.24,
    taperPower: 0.85,
    barkFlutes: 6,
    fluteDepth: 0.09,
    twistTurns: -0.2,
    energyVeinWeight: 0.75,
  },
  // 9. Deep Abyssal Central Taproot 1
  {
    points: [
      [-1.2, -3.5, -4.6],
      [-2.4, -8.2, -4.2],
      [-3.8, -13.8, -3.4],
      [-5.2, -19.8, -2.5],
      [-6.5, -26.0, -1.8],
    ],
    radiusStart: 1.95,
    radiusEnd: 0.38,
    taperPower: 0.82,
    barkFlutes: 7,
    fluteDepth: 0.1,
    twistTurns: 0.25,
    energyVeinWeight: 0.85,
  },
  // 10. Deep Abyssal Central Taproot 2
  {
    points: [
      [1.25, -3.6, -4.6],
      [2.5, -8.4, -4.0],
      [4.0, -14.0, -3.2],
      [5.4, -20.0, -2.2],
      [6.8, -26.2, -1.5],
    ],
    radiusStart: 1.92,
    radiusEnd: 0.38,
    taperPower: 0.82,
    barkFlutes: 7,
    fluteDepth: 0.1,
    twistTurns: -0.25,
    energyVeinWeight: 0.85,
  },
  // 11. Far West Deep Root
  {
    points: [
      [-3.2, -2.4, -5.4],
      [-7.8, -5.8, -6.8],
      [-13.5, -10.8, -8.2],
      [-19.5, -17.2, -9.6],
      [-25.0, -24.5, -11.0],
    ],
    radiusStart: 1.55,
    radiusEnd: 0.28,
    taperPower: 0.85,
    barkFlutes: 6,
    fluteDepth: 0.09,
    twistTurns: 0.2,
    energyVeinWeight: 0.65,
  },
  // 12. Far East Deep Root
  {
    points: [
      [3.25, -2.4, -5.4],
      [7.9, -5.6, -6.6],
      [13.8, -10.6, -8.0],
      [19.8, -17.0, -9.4],
      [25.4, -24.2, -10.8],
    ],
    radiusStart: 1.52,
    radiusEnd: 0.28,
    taperPower: 0.85,
    barkFlutes: 6,
    fluteDepth: 0.09,
    twistTurns: -0.2,
    energyVeinWeight: 0.65,
  },
];
