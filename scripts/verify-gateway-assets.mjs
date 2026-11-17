// Static verification of the approved master-tree energy atlas and source asset links.
// No extra npm dependencies; executed in GitHub Actions before a production Vite build.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const root='multiverse404_pixel_aligned_energy_map/multiverse404_energy_maps';
const required=['tree_reference','tree_emissive','tree_emissive_cyan','tree_emissive_violet',
 'tree_flow_rg','branch_techverse','branch_gameverse','branch_aiverse','branch_humanverse',
 'branch_vibeverse','branch_cyberverse','branch_futureverse'];
function dimensions(file) {
 const buffer=readFileSync(file);
 assert.equal(buffer.toString('ascii',1,4),'PNG',file+' should be PNG');
 assert.equal(buffer.toString('ascii',12,16),'IHDR',file+' missing IHDR');
 return [buffer.readUInt32BE(16),buffer.readUInt32BE(20)];
}
for (const name of required) {
 const file=join(root,name+'.png');
 assert.ok(existsSync(file),file+' missing');
 const [w,h]=dimensions(file);
 assert.deepEqual([w,h],[1536,1024],name+' must match the tree source pixels');
}
for (const name of ['techverse','gameverse','vibeverse','aiverse','cyberverse','humanverse','futureverse']) {
 assert.ok(existsSync('public/assets/cosmic-tree/portals/'+
  ({techverse:'01',gameverse:'02',vibeverse:'03',aiverse:'04',cyberverse:'05',humanverse:'06',futureverse:'07'}[name])+
  '_'+name+'_reality_tear.png'),name+' portal missing');
 assert.ok(existsSync('assets/'+name+'-bg.webp'),name+' scene background missing');
}
const src=readFileSync('src/gateway/initGateway.js','utf8');
assert.ok(src.includes('approvedTreeUrl') && src.includes('uSelectedBranchMask'));
assert.ok(src.includes('window.VisionexaUniverse.enter(portalNode.cfg.id)'));
console.log('All 12 atlas maps match 1536×1024 and all seven portal assets/scene backgrounds exist.');
