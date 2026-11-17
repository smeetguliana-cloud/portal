# MULTIVERSE 404 — Cosmic Tree Gateway (review branch)

This branch upgrades the existing Visionexa '26 gateway **without replacing** any of the seven mascots, their backgrounds, videos, or information/registration interfaces.

## Run locally

1. Clone the repository and check out `feature/cosmic-tree-gateway-energy-20261117`.
2. Run `npm install`.
3. Run `npm run dev`; open the local Vite URL.
4. Run `node scripts/verify-gateway-assets.mjs` to check source-map dimensions and referenced portal files.
5. Run `npm run build` to generate `dist/`.
6. Deploy the repository with framework Vite and build command `npm run build` / output directory `dist` (Vercel or similar). The existing Vite plugin copies legacy mascot and universe assets.

## What changed

- **Master tree:** `multiverse404_pixel_aligned_energy_map/multiverse404_energy_maps/tree_reference.png` (1536×1024)
- **Glow:** source-aligned emissive, cyan/violet, flow RG, and per-branch masks. Imported into Vite from repository sources and bundled for deployment
- **Portals:** seven distinct supplied `public/assets/cosmic-tree/portals/*.png` files blended with the existing universe panorama previews
- **Interaction:** a selected branch mask gates the hover glow; gentle time-varying energy moves across existing emission pixels. The RG field is an approximated tangent map, *not* exact manually traced flow
- **Navigation:** portal selections call the existing `window.VisionexaUniverse.enter(universeId)` directly; the long screen-tear journey is deferred
- **Mobile:** seven 44px-minimum destination controls keep all universes accessible without excessive panning

## Physical branch mapping

The previously generated energy-map filenames refer to an older universe arrangement. Their original positions—not the old filenames—are mapped as follows:

| Position | Universe | Original mask filename |
|---|---|---|
| Upper left | Techverse | `branch_techverse.png` |
| Middle left | Gameverse | `branch_gameverse.png` |
| Lower left | Vibeverse | `branch_aiverse.png` |
| Top center | Futureverse | `branch_humanverse.png` |
| Upper right | AIverse | `branch_vibeverse.png` |
| Middle right | Cyberverse | `branch_cyberverse.png` |
| Lower right | Humanverse | `branch_futureverse.png` |

## Important review notes

- Atlas assets are structurally checked for matching 1536×1024 dimensions, but masks were generated algorithmically and are not guaranteed to match every individual visible vein.
- The existing canopy/root extensions and atmospheric layers are retained; assess their visual fit with the newly approved master tree in-browser. Some pre-existing extracted layers may not match its silhouette.
- GitHub Actions validates dimensions and runs the production Vite build; successful compilation alone **does not verify** browser visuals, live FPS, shader compilation on every GPU, or all navigation behavior.
- The PR is deliberately a **draft**, so review the deployed branch before merging into `main`.

## Recommended manual acceptance checklist

- Open the gateway on desktop and mobile; verify sharp main tree and restrained clouds.
- Hover each portal: only its physical branch should brighten, and the pulse should move outward.
- Select all seven portals: each must load the original universe scene and mascot with the original info and registration UI.
- Return to Nexus after visiting a universe and repeat for another.
- Test mouse drag, mobile tap versus swipe, and reduced-motion settings.
- Check the console and network panel for missing textures or WebGL shader errors.
