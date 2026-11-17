/**
 * Approved MULTIVERSE 404 artwork. Vite resolves these URLs in both development
 * and production; no network-hosted image, mascot, or universe background is changed.
 *
 * Important: tree_reference and every mask below are from the SAME 1536x1024
 * coordinate system. Do not mix them with assets/layer2_tree.png or
 * assets/layer4_emissive.png (a different composition).
 */
import tree from '../../multiverse404_pixel_aligned_energy_map/multiverse404_energy_maps/tree_reference.png?url';
import emissive from '../../multiverse404_pixel_aligned_energy_map/multiverse404_energy_maps/tree_emissive.png?url';
import techMask from '../../multiverse404_pixel_aligned_energy_map/multiverse404_energy_maps/branch_techverse.png?url';
import gameMask from '../../multiverse404_pixel_aligned_energy_map/multiverse404_energy_maps/branch_gameverse.png?url';
import leftLowerMask from '../../multiverse404_pixel_aligned_energy_map/multiverse404_energy_maps/branch_aiverse.png?url';
import topMask from '../../multiverse404_pixel_aligned_energy_map/multiverse404_energy_maps/branch_humanverse.png?url';
import rightUpperMask from '../../multiverse404_pixel_aligned_energy_map/multiverse404_energy_maps/branch_vibeverse.png?url';
import cyberMask from '../../multiverse404_pixel_aligned_energy_map/multiverse404_energy_maps/branch_cyberverse.png?url';
import rightLowerMask from '../../multiverse404_pixel_aligned_energy_map/multiverse404_energy_maps/branch_futureverse.png?url';

import sky from '../../Celestial Nebula with Crescent Worlds-1.png?url';
import techPortal from '../../Futuristic Cyan Portal Vortex-2.png?url';
import gamePortal from '../../Molten Flame Portal Vortex-3.png?url';
import vibePortal from '../../Neon Vibeverse Portal Orb-2.png?url';
import aiPortal from '../../Arcane Galaxy Portal Medallion-1.png?url';
import cyberPortal from '../../Cybernetic Neon Portal Emblem-1.png?url';
import humanPortal from '../../Humanverse_ Portal of Humanity-3.png?url';
import futurePortal from '../../Neon Portal to a Futuristic City-4.png?url';

export const GATEWAY_ART = Object.freeze({
  sky,
  tree,
  emissive,
  aspect: 1536 / 1024,
  // The source pack labels refer to branch positions, NOT the approved universe
  // assignments. Reassign them here; never rotate/re-synthesize the artwork.
  masks: Object.freeze({
    techverse: techMask,
    gameverse: gameMask,
    vibeverse: leftLowerMask,
    futureverse: topMask,
    aiverse: rightUpperMask,
    cyberverse: cyberMask,
    humanverse: rightLowerMask,
  }),
  portals: Object.freeze({
    techverse: techPortal,
    gameverse: gamePortal,
    vibeverse: vibePortal,
    aiverse: aiPortal,
    cyberverse: cyberPortal,
    humanverse: humanPortal,
    futureverse: futurePortal,
  }),
});
