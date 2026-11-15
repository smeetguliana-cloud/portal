// Visionexa '26 — The Infinite Cosmic Tree Environment Prototype Controller
import './gatewayUI.css';
import { MultiverseGateway } from './gatewayScene.js';

function initMultiverseGateway() {
  document.body.classList.add('gateway-active');

  const gatewayRoot = document.createElement('section');
  gatewayRoot.id = 'multiverse-gateway';
  gatewayRoot.setAttribute(
    'aria-label',
    "Visionexa '26 — The Infinite Cosmic Tree Environment"
  );

  const vignette = document.createElement('div');
  vignette.className = 'gateway-vignette';
  vignette.setAttribute('aria-hidden', 'true');

  // Minimal Top Branding
  const header = document.createElement('header');
  header.className = 'gateway-header';
  header.setAttribute('data-gateway-ui', 'true');
  header.innerHTML = `
    <h1 class="gateway-brand-title">VISIONEXA <span>'26</span></h1>
    <div class="gateway-subtitle-prompt">THE INFINITE COSMIC TREE</div>
  `;

  // Subtle spatial camera controls so visitors can inspect Canopy, Roots, and Horizon
  const lookHud = document.createElement('div');
  lookHud.className = 'gateway-look-hud';
  lookHud.setAttribute('data-gateway-ui', 'true');
  lookHud.innerHTML = `
    <div class="gateway-look-controls" role="group" aria-label="Camera Orientation Controls">
      <button type="button" class="gateway-look-btn" data-look="left" title="Look Left Across Branches">← West</button>
      <button type="button" class="gateway-look-btn" data-look="up" title="Look Upward Into Luminous Cloud Canopy">↑ Canopy</button>
      <button type="button" class="gateway-look-btn" data-look="center" title="Recenter Horizon View">◎ Sanctum</button>
      <button type="button" class="gateway-look-btn" data-look="down" title="Look Downward Into Abyssal Roots">↓ Roots</button>
      <button type="button" class="gateway-look-btn" data-look="right" title="Look Right Across Branches">East →</button>
    </div>
    <div class="gateway-look-hint">MOVE OR DRAG TO LOOK AROUND THE DIMENSION</div>
  `;

  gatewayRoot.appendChild(vignette);
  gatewayRoot.appendChild(header);
  gatewayRoot.appendChild(lookHud);
  document.body.appendChild(gatewayRoot);

  const gatewayInstance = new MultiverseGateway({
    container: gatewayRoot,
  });

  // Wire directional look buttons
  lookHud.querySelectorAll('[data-look]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dir = btn.getAttribute('data-look');
      if (dir === 'up') {
        gatewayInstance.lookInDirection(0, 0.34);
      } else if (dir === 'down') {
        gatewayInstance.lookInDirection(0, -0.34);
      } else if (dir === 'left') {
        gatewayInstance.lookInDirection(-0.38, 0);
      } else if (dir === 'right') {
        gatewayInstance.lookInDirection(0.38, 0);
      } else if (dir === 'center') {
        gatewayInstance.resetView();
      }
    });
  });

  // Keyboard look-around navigation (Up = Canopy, Down = Roots, Left/Right = Horizon)
  window.addEventListener('keydown', (e) => {
    if (!document.body.classList.contains('gateway-active')) return;

    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      gatewayInstance.lookInDirection(0, 0.16);
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      e.preventDefault();
      gatewayInstance.lookInDirection(0, -0.16);
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      gatewayInstance.lookInDirection(-0.18, 0);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      gatewayInstance.lookInDirection(0.18, 0);
    } else if (e.key === 'Escape' || e.key === ' ') {
      gatewayInstance.resetView();
    }
  });

  window.VisionexaGateway = gatewayInstance;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMultiverseGateway);
} else {
  initMultiverseGateway();
}
