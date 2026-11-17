import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4173';
const browser = await chromium.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--enable-webgl',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});
const errors = [];
async function setup(page) {
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => {
    if (msg.type() === 'error' && /WebGLProgram|shader error|THREE\.WebGL|Uncaught|Failed to load/i.test(msg.text())) {
      errors.push(msg.text().slice(0, 500));
    }
  });
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => window.VisionexaGateway?.portalNodes?.length === 7, null, { timeout: 60000 });
  await page.waitForFunction(() => {
    const g = window.VisionexaGateway;
    return g.treeUniforms?.uHasBase.value === 1 &&
      g.treeUniforms?.uHasMask.value === 1 &&
      g.portalNodes.every(n => n.uniforms.uHasArtwork.value === 1 && !!n.branchMaskTexture);
  }, null, { timeout: 60000 });
  await page.waitForTimeout(1600);
}
async function capture(page, kind) {
  const jpg = await page.screenshot({ type: 'jpeg', quality: 55, animations: 'disabled' });
  console.log('BEGIN_GATEWAY_SCREENSHOT_' + kind);
  console.log(jpg.toString('base64'));
  console.log('END_GATEWAY_SCREENSHOT_' + kind);
}
try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await setup(desktop);
  const info = await desktop.evaluate(() => {
    const g = window.VisionexaGateway;
    return {
      ids: g.portalNodes.map(n => n.cfg.id),
      treeAspect: g.treeDimensions.width / g.treeDimensions.height,
      portalCoords: g.portalNodes.map(n => n.cfg.portalUv),
      visible: getComputedStyle(document.getElementById('multiverse-gateway')).display !== 'none',
    };
  });
  assert.equal(info.ids.length, 7);
  assert(Math.abs(info.treeAspect - 1.5) < 0.001, 'Tree aspect distorted: ' + info.treeAspect);
  assert(info.visible, 'Gateway hidden at boot');
  await capture(desktop, 'DESKTOP');

  // Use the same app callback as a genuine portal click without guessing pixel targets.
  await desktop.evaluate(() => {
    const g = window.VisionexaGateway;
    g.triggerDimensionalDive(g.portalNodes.find(n => n.cfg.id === 'techverse'));
  });
  await desktop.waitForFunction(() =>
    !document.body.classList.contains('gateway-active') &&
    window.VisionexaUniverse?.isMounted(), null, { timeout: 20000 });
  await desktop.waitForFunction(() => !window.VisionexaGateway.isTransitioning, null, { timeout: 10000 });
  await desktop.locator('#return-to-nexus').click({ timeout: 10000 });
  await desktop.waitForFunction(() => document.body.classList.contains('gateway-active'), null, { timeout: 10000 });
  await desktop.close();

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  await setup(mobile);
  const dock = mobile.locator('.gateway-mobile-portals');
  assert(await dock.isVisible(), 'Mobile universe selector not visible');
  assert.equal(await dock.locator('button').count(), 7);
  await capture(mobile, 'MOBILE');
  await mobile.getByRole('button', { name: 'Enter Vibeverse' }).click();
  await mobile.waitForFunction(() =>
    !document.body.classList.contains('gateway-active') &&
    window.VisionexaUniverse?.isMounted(), null, { timeout: 20000 });
  await mobile.close();

  assert.equal(errors.length, 0, 'Browser/GL errors: ' + errors.join(' | '));
  console.log('Gateway browser smoke PASS: art, registered masks, 7 portals, desktop handoff, mobile selector, return.');
} finally {
  await browser.close();
}
