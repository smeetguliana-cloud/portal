import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Preserves the project's existing root `/assets` and `/*.mp4` structure
 * while ensuring all static textures, mascot layers, and universe videos
 * are copied verbatim into `dist/` during `vite build` (e.g. on Vercel).
 */
function copyRootStaticAssetsPlugin() {
  return {
    name: 'copy-root-static-assets',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (
          /^assets\/techverse-bg-[A-Za-z0-9_-]+\.webp$/.test(fileName) ||
          /^assets\/tech-[A-Za-z0-9_-]+\.webp$/.test(fileName)
        ) {
          delete bundle[fileName];
        } else if (
          fileName === 'index.html' &&
          chunk.type === 'asset' &&
          typeof chunk.source === 'string'
        ) {
          chunk.source = chunk.source
            .replace(
              /href="\/?assets\/techverse-bg-[A-Za-z0-9_-]+\.webp"/g,
              'href="/assets/techverse-bg.webp"'
            )
            .replace(
              /href="\/?assets\/tech-[A-Za-z0-9_-]+\.webp"/g,
              'href="/assets/tech.webp"'
            );
        }
      }
    },
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist');
      if (!fs.existsSync(outDir)) return;

      // 1. Copy root /assets directory (all universe *-bg.webp, mascot .webp, and mascot-layers/*)
      const srcAssetsDir = path.resolve(__dirname, 'assets');
      const destAssetsDir = path.resolve(outDir, 'assets');
      if (fs.existsSync(srcAssetsDir)) {
        fs.cpSync(srcAssetsDir, destAssetsDir, {
          recursive: true,
          force: true,
        });
      }

      // 2. Copy root universe *.mp4 videos into dist/
      const rootEntries = fs.readdirSync(__dirname, { withFileTypes: true });
      for (const entry of rootEntries) {
        if (entry.isFile() && entry.name.endsWith('.mp4')) {
          const srcVideo = path.resolve(__dirname, entry.name);
          const destVideo = path.resolve(outDir, entry.name);
          fs.copyFileSync(srcVideo, destVideo);
        }
      }
    },
  };
}

export default defineConfig({
  publicDir: 'public',
  plugins: [copyRootStaticAssetsPlugin()],
});
