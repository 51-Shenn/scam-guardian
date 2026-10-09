import { mkdir, writeFile } from 'node:fs/promises';

// Static companion to src/components/guardian/flow-art.web.tsx: the same flow field at time zero, drawn once.
// Seeded so the asset is reproducible. Run: node scripts/build-native-art.mjs
const WIDTH = 480, HEIGHT = 760, ACCENT = '#1447e6', ZOOM = 2.4;
let seed = 20261009;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const angle = (x, y) => Math.sin(x * ZOOM * 0.0026) * 1.05 + Math.cos(y * ZOOM * 0.0052) * 1.1 + Math.sin((x - y) * ZOOM * 0.0017) * 0.55;

let shapes = '';
for (let x = 0; x <= WIDTH; x += 44) shapes += `<path d="M${x} 0V${HEIGHT}" opacity=".07"/>`;
for (let y = 0; y <= HEIGHT; y += 44) shapes += `<path d="M0 ${y}H${WIDTH}" opacity=".07"/>`;
for (let line = 0; line < 150; line++) {
  let x = random() * WIDTH, y = random() * HEIGHT;
  const points = [];
  for (let step = 0; step < 70; step++) {
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    const direction = angle(x, y);
    x += (0.85 + Math.cos(direction) * 0.75) * 2.4;
    y += Math.sin(direction) * 1.25 * 2.4;
  }
  shapes += `<polyline points="${points.join(' ')}" opacity="${(0.12 + random() * 0.2).toFixed(2)}" stroke-linecap="round"/>`;
}
await mkdir('assets/guardian', { recursive: true });
await writeFile('assets/guardian/current.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}"><g fill="none" stroke="${ACCENT}" stroke-width="1">${shapes}</g></svg>`);
console.log('Wrote assets/guardian/current.svg');
