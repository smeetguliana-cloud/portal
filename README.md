# MULTIVERSE 404 — Reality Not Found

An interactive seven-universe portal built with HTML, CSS, JavaScript and Three.js.

## Mascot interaction

Each mascot has a distinct click-triggered signature sequence, built from lightweight CSS effects and whole-sprite motion (no additional 3D models or large particle assets):

- **Techverse:** brief power-down, circuit/grid boot-up, scanning sweep and SYSTEM ONLINE finish.
- **Gameverse:** energetic bounce, pixel burst, LEVEL UP message and XP meter fill.
- **Vibeverse:** rhythmic bounce, radiating waveform rings and animated equalizer bars.
- **AIverse:** neural nodes illuminate, a data grid expands and AI ONLINE appears.
- **Cyberverse:** a shield forms, a threat scan sweeps through and the system is secured.
- **Humanverse:** a warm pulse with orbiting creativity/connection symbols.
- **Futureverse:** a temporal portal opens, rings rotate and the portal folds away.

The mascot returns to its idle hover/breathing loop after each ~3.6-second sequence. Click cooldown, reduced-motion support, and drag-vs-click separation are retained. The original mascot artwork is a single flat image per universe, so the character itself is animated as a complete sprite; independent eye/arm articulation would require genuinely separated source layers.

## Controls

- Drag the scene to look around.
- Click a mascot to activate its signature sequence.
- Use the bottom navigation to switch universes.
- Use the view controls to recenter or look left/right.
- Add `?debug=1` or press `Alt+C` to open calibration controls.

## Run

Open `index.html` in a modern browser with an internet connection (Three.js and Google Fonts are loaded from CDNs). Keep the `assets` folder beside `index.html`.
