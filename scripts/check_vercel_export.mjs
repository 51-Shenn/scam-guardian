/** Validate the static hosting artifact's direct routes, local assets and public-file boundary before deployment. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
assert.equal(app.expo.web.output, 'static', 'Hosting checker covers static Expo output only');
assert.equal(config.cleanUrls, true, 'Direct extensionless links need cleanUrls');
assert.equal(config.framework, null, 'Do not let Vercel infer a different framework');
assert.ok(!config.rewrites?.length, 'Static per-route HTML must not be rewritten to the landing page');
assert.deepEqual(lock.packages[''].engines, pkg.engines, 'Lockfile engine metadata must match');
const dist = path.resolve(root, config.outputDirectory);
assert.equal(dist, path.join(root, 'dist'));
const required = ['index.html', 'demo.html', 'evidence.html', 'pitch-manual.html', 'testing-manual.html', 'hairline-locks.html'];
const references = new Set();
for (const file of required) {
  const html = fs.readFileSync(path.join(dist, file), 'utf8');
  assert.ok(html.includes('<html'), `${file}: missing HTML document`);
  for (const [, attribute, url] of html.matchAll(/\b(src|href)=["']([^"']+)["']/g)) {
    if (/^(?:https?:|data:|blob:|#|mailto:)/i.test(url)) {
      assert.ok(!/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::|\/|$)/i.test(url), `${file}: local-only ${attribute}`);
      continue;
    }
    const pathname = decodeURIComponent(url.split(/[?#]/)[0]);
    if (!pathname) continue;
    let target = path.resolve(path.dirname(path.join(dist, file)), pathname.startsWith('/') ? '.' + pathname : pathname);
    assert.ok(target === dist || target.startsWith(dist + path.sep), `${file}: asset escapes export`);
    if (target === dist) target = path.join(dist, 'index.html');
    if (!path.extname(target) && !fs.existsSync(target)) target += '.html';
    assert.ok(fs.existsSync(target), `${file}: missing ${url}`);
    references.add(path.relative(dist, target).replaceAll('\\', '/'));
  }
}
const manual = fs.readFileSync(path.join(dist, 'testing-manual.html'), 'utf8');
for (let i = 1; i <= 10; i++) assert.ok(manual.includes(`MT${String(i).padStart(2, '0')}`), `Missing manual case ${i}`);
assert.ok(manual.includes('href="/demo"'), 'Manual must link to the hosted app');
assert.ok(!fs.existsSync(path.join(dist, 'data')), 'Session/evaluation folders must not be publicly served');
assert.ok(!fs.existsSync(path.join(dist, 'reference')), 'Research source must not be publicly served');
assert.ok(references.size > 0, 'No assets or route links checked');
console.log(`Static hosting check passed: ${required.length} direct pages, ${references.size} distinct local asset/link targets, ten manual cases. Vercel cloud deployment remains untested.`);
