/** Check the exported web app in an isolated headless Edge session: early visibility, FIR accounting and local JSON export. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pitch = process.argv.includes('--pitch');
const base = path.join(root, pitch ? 'data/processed/pitch-evidence-v1/browser' : 'data/processed/warning-measurements-v1/browser');
const out = path.join(base, `run-${Date.now()}`);
const profile = path.join(out, 'edge-profile');
fs.mkdirSync(profile, { recursive: true });
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
assert.ok(fs.existsSync(edge), 'Confirmed Edge browser is required.');
const server = spawn(process.execPath, [path.join(root, 'scripts/preview.mjs'), 'dist', '4184'], { cwd: root, windowsHide: true, stdio: 'ignore' });
const browser = spawn(edge, ['--headless=new', '--window-size=1440,1000', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
  '--disable-background-networking', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(fn, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { const result = await fn(); if (result) return result; await delay(100); }
  throw new Error('Browser acceptance condition timed out.');
}
let socket, sessionId, next = 0, presenterReport = null;
const pending = new Map(), errors = [], checks = [];
function send(method, params = {}, session = sessionId) {
  const id = ++next;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params, ...(session ? { sessionId: session } : {}) }));
  });
}
async function evaluate(expression) {
  const reply = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (reply.exceptionDetails) throw new Error(JSON.stringify(reply.exceptionDetails));
  return reply.result.value;
}
async function click(text, role = 'button', aria = false) {
  const selector = role === 'button' ? 'button, [role="button"]' : `[role="${role}"]`;
  const match = aria ? `e.getAttribute('aria-label')===${JSON.stringify(text)}`
    : role === 'radio' ? `!e.hasAttribute('aria-label') && e.textContent.trim().startsWith(${JSON.stringify(text)})`
      : `e.textContent.trim()===${JSON.stringify(text)}`;
  const expression = `(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>(${match}) && !e.closest('[inert], [aria-hidden="true"]') && e.getBoundingClientRect().width>0 && e.getBoundingClientRect().height>0); if(!e) throw Error('Missing control '+${JSON.stringify(text)}); if(e.disabled || e.getAttribute('aria-disabled')==='true') throw Error('Disabled control'); e.scrollIntoView({block:'nearest'}); const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`;
  const point = await evaluate(expression);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
  // Screens and sheets animate for up to 450 ms; wait before locating the next real click target.
  await delay(550);
}
async function typeAccount() {
  const point = await evaluate("(()=>{const e=[...document.querySelectorAll('input[aria-label=\"Account number\"]')].find(e=>!e.closest('[inert], [aria-hidden=\"true\"]')&&e.getBoundingClientRect().width>0);if(!e)throw Error('Missing account field');e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()");
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
  await send('Input.insertText', { text: '123412341234' });
}
const readOut = "([...document.querySelectorAll('.glass')].find(e=>e.innerText.startsWith('Guardian read-out'))?.innerText ?? '')";
const matches = (pattern) => evaluate(`${pattern}.test(document.body.innerText)`);
async function shot(name) {
  const reply = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(out, name), Buffer.from(reply.data, 'base64'));
}
try {
  await until(async () => { try { return (await fetch('http://127.0.0.1:4184/demo')).ok; } catch { return false; } });
  assert.equal((await fetch('http://127.0.0.1:4184/')).headers.get('cache-control'), 'no-store');
  checks.push('Local preview disables browser caching of the exported layout.');
  const portFile = path.join(profile, 'DevToolsActivePort');
  await until(() => fs.existsSync(portFile));
  const [port, endpoint] = fs.readFileSync(portFile, 'utf8').trim().split(/\r?\n/);
  socket = new WebSocket(`ws://127.0.0.1:${port}${endpoint}`);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const promise = pending.get(message.id);
      if (!promise) return;
      clearTimeout(promise.timer); pending.delete(message.id);
      if (message.error) promise.reject(new Error(JSON.stringify(message.error))); else promise.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params);
  });
  const target = await send('Target.createTarget', { url: 'http://127.0.0.1:4184/demo' }, null);
  sessionId = (await send('Target.attachToTarget', { targetId: target.targetId, flatten: true }, null)).sessionId;
  await send('Runtime.enable'); await send('Page.enable'); await send('Page.bringToFront');
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: out }, null);
  await until(() => evaluate("document.body.innerText.includes('Guardian read-out') && document.body.innerText.includes('False interventions')"));
  checks.push('Exported app loads the read-out and the run measurements.');

  // A known legitimate payment with a simulated call to a new payee exposes a rule false review.
  await click('Coached', 'radio');
  await click('Evaluation label Normal', 'radio', true);
  await click('Transfer'); await click('Agree and turn on');
  await until(() => matches('/Raised by rules at \\d/'));
  // A transfer locks its set-up: the label choices give way to a line that states them.
  assert.equal(await evaluate("document.querySelectorAll('[aria-label=\"Evaluation label Normal\"]').length === 0 && document.body.innerText.includes('Locked until this transfer ends') && document.body.innerText.includes('Evaluation label: Normal')"), true);
  await shot('early-warning.png');
  checks.push('A recipient-stage warning is shown before Review; annotation is locked.');
  await click('Cancel');
  await until(() => matches('/False interventions\\s*1 of 1/'));
  checks.push('Cancelled legitimate warning enters FIR as 1/1, not zero.');

  await click('Prepare MT02 · AI warning test');
  assert.equal(await evaluate("document.querySelector('[aria-label=\"Authored request coached\"]').getAttribute('aria-checked')==='true' && document.querySelector('[aria-label=\"Evaluation label Coached-high\"]').getAttribute('aria-checked')==='true' && document.body.innerText.includes('Start simulated call')"), true);
  checks.push('MT02 setup configures coached input and independent label with call off; actual inference still determines warning.');
  await click('Transfer');
  await click('Recipient New recipient', 'radio', true);
  assert.equal(await evaluate("document.body.innerText.includes('Coached request with warning bypass') && document.body.innerText.includes('Selected, not delivered yet')"), true);
  await click('Deliver authored request', 'button', true);
  await until(() => evaluate("document.body.innerText.includes('Delivered to this transfer')"));
  await until(async () => (await matches('/Raised by AI at \\d/')) && evaluate("document.body.innerText.includes('Rules quiet')"));
  assert.equal(await evaluate(`${readOut}.includes('Policy category') && !${readOut}.includes('%')`), true);
  if (pitch) {
    await until(() => evaluate("document.body.innerText.includes('Why the first AI review fired') && document.body.innerText.includes('All terms sum to')"));
    assert.equal(await evaluate(`${readOut}.includes('Warning bypass instructions') && ${readOut}.includes('Policy priority') && ${readOut}.includes('Check before confirmation')`), true);
    checks.push('Actual first-positive LR contributions and policy category/priority reach the UI.');
  }
  await shot('ai-early-warning.png');
  await typeAccount(); await click('Next'); await click('5'); await click('0'); await click('Review');
  if (pitch) {
    await click('Open independent-check guide');
    assert.equal(await evaluate("document.body.innerText.includes('Use a contact number you already know') && document.body.innerText.includes('does not call anyone or certify a recipient')"), true);
    await shot('independent-check-guide.png');
    checks.push('Independent-check guidance opens without claiming real verification or contact.');
  }
  await click('I want to review it myself');
  await delay(15500);
  await click('Continue with transfer');
  await until(() => evaluate("document.body.innerText.includes('Demo transfer complete')"));
  // The run measurements return with the set-up controls once the transfer has ended.
  await click('Done');
  await until(() => evaluate("document.body.innerText.includes('Median lead')"));
  assert.equal(await matches('/Median lead\\s*Not measured/'), false);
  checks.push('Actual frozen AI warns while transaction rules stay quiet; cool-down and confirmation produce a labelled live lead.');
  checks.push('The read-out shows no percentages; selected and delivered request context are distinguished.');

  await click('Normal', 'radio');
  await click('Authored request routine', 'radio', true);
  await click('Evaluation label Normal', 'radio', true);
  await click('Transfer'); await click('Deliver authored request', 'button', true); await click('Next');
  await click('5'); await click('0');
  await delay(5500);
  await until(() => evaluate("document.body.innerText.includes('No warning currently')"));
  await click('Review'); await click('Confirm transfer');
  await until(() => evaluate("document.body.innerText.includes('Demo transfer complete')"));
  checks.push('A routine authored request completes without a warning, using actual local inference.');

  await click('Done');
  await click('Download metrics JSON');
  const exported = path.join(out, 'scam-guardian-warning-metrics.json');
  await until(() => fs.existsSync(exported));
  const report = JSON.parse(fs.readFileSync(exported, 'utf8'));
  assert.equal(report.sessions.length, 3);
  assert.equal(report.summary.falseInterventionRate, 0.5);
  assert.equal(report.summary.legitimateSessions, 2);
  assert.equal(report.sessions[2].firstWarningMs, null);
  assert.equal(report.summary.confirmedCoachedSessions, 1);
  const coached = report.sessions[1];
  assert.equal(coached.warningOrigin, 'ai');
  assert.ok(coached.firstWarningMs < coached.reviewEnteredMs);
  assert.ok(coached.observedLeadMs >= 15000, 'Live lead includes the enforced pause.');
  assert.ok(!fs.readFileSync(exported, 'utf8').includes('123412341234'));
  const recompute = spawnSync(process.execPath, [path.join(root, 'scripts/evaluate_warning_sessions.mjs'), exported, ...(pitch ? [out] : [])], { cwd: root, encoding: 'utf8' });
  assert.equal(recompute.status, 0, recompute.stderr);
  checks.push('Real browser download is content-free and independently recomputes from session timestamps.');
  await shot('metrics-desktop.png');

  // Return through the UI so the same provider still holds the completed measurement history.
  await click('Product page', 'button', true);
  await until(() => evaluate("document.body.innerText.includes('A pause before the money moves.')"));
  for (const [width, height] of [[1700, 900], [1320, 820], [1200, 760], [860, 780], [390, 844]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await delay(600);
    assert.equal(await evaluate("!document.body.innerText.includes('Guardian read-out') && !document.body.innerText.includes('False interventions')"), true, 'The landing hero must not contain the live monitoring panel.');
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), true, `Landing overflow at ${width}`);
    const card = await evaluate("(()=>{const e=document.querySelector('[aria-label=\"Normal: No interruption. Open in the demo\"]').closest('.glass');const r=e.getBoundingClientRect();return {top:r.top,left:r.left,right:r.right};})()");
    assert.ok(card.top >= 64 && card.left >= -1 && card.right <= width + 1, JSON.stringify({ width, card }));
    const overlap = await evaluate("(()=>{const r=document.querySelector('[aria-label=\"Open the banking demo\"]').getBoundingClientRect();const e=document.querySelector('[aria-label=\"Normal: No interruption. Open in the demo\"]').closest('.glass').getBoundingClientRect();return {width:Math.max(0,Math.min(r.right,e.right)-Math.max(r.left,e.left)),height:Math.max(0,Math.min(r.bottom,e.bottom)-Math.max(r.top,e.top))};})()");
    // Beside the phone the glass card laps 28 px over the frame's edge; it never reaches further into the preview.
    assert.ok(overlap.width <= 29 || overlap.height <= 1, `Scenario card covers the phone: ${JSON.stringify({ width, overlap })}`);
    await shot(`landing-${width}.png`);
    checks.push(`Landing keeps the scenario card within the page and at most 28 px over the phone's edge, with no header or horizontal overflow at ${width}x${height}.`);
  }
  await send('Emulation.clearDeviceMetricsOverride');
  await click('Open the banking demo', 'button', true);
  await until(() => evaluate("document.body.innerText.includes('False interventions')"));
  assert.equal(await matches('/False interventions\\s*1 of 2/'), true, 'Navigation must preserve the measurement history.');
  checks.push('Returning from landing preserves the current measurement history.');

  // This verifies a narrow web viewport, not mobile-device emulation or an Android runtime.
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await until(() => evaluate("[...document.querySelectorAll('[role=\"tab\"]')].some(e=>e.textContent.trim()==='Guardian')"));
  await click('Guardian', 'tab');
  await until(() => matches('/False interventions\\s*1 of 2/'));
  await shot('metrics-narrow.png');
  assert.equal(errors.length, 0, JSON.stringify(errors));
  checks.push('Narrow web Guardian tab exposes the same metrics without JavaScript exceptions.');
  if (pitch) {
    // The presenter flow ends with cancellation, not an invented confirmation lead.
    await send('Emulation.clearDeviceMetricsOverride');
    await until(() => evaluate("[...document.querySelectorAll('[role=\"radio\"]')].some(e=>e.textContent.trim()==='Normal')"));
    await click('Normal', 'radio'); await click('Authored request coached', 'radio', true);
    await click('Evaluation label Coached-high', 'radio', true); await click('Transfer');
    await click('Recipient New recipient', 'radio', true); await click('Deliver authored request', 'button', true);
    await until(() => evaluate("document.body.innerText.includes('Why the first AI review fired')"));
    await typeAccount(); await click('Next'); await click('5'); await click('0'); await click('Review');
    await click('Open independent-check guide'); await click('Cancel this transfer');
    // Cancelling returns the set-up controls, and the read-out keeps the last transfer's AI review.
    await until(() => evaluate("document.body.innerText.includes('Monitoring inactive') && document.body.innerText.includes('Last transfer: Review recommended')"));
    const presenterDir = path.join(out, 'presenter');
    fs.mkdirSync(presenterDir, { recursive: true });
    await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: presenterDir }, null);
    await click('Download metrics JSON');
    const presenterFile = path.join(presenterDir, 'scam-guardian-warning-metrics.json');
    await until(() => fs.existsSync(presenterFile));
    presenterReport = JSON.parse(fs.readFileSync(presenterFile, 'utf8'));
    const presenterRecompute = spawnSync(process.execPath, [path.join(root, 'scripts/evaluate_warning_sessions.mjs'), presenterFile, presenterDir], { cwd: root, encoding: 'utf8' });
    assert.equal(presenterRecompute.status, 0, presenterRecompute.stderr);
    assert.equal(presenterReport.sessions.length, 4);
    assert.equal(presenterReport.sessions[3].outcome, 'cancelled');
    assert.equal(presenterReport.sessions[3].confirmationMs, null);
    assert.equal(presenterReport.sessions[3].observedLeadMs, null);
    assert.equal(presenterReport.sessions[3].warningOrigin, 'ai');
    checks.push('Presenter flow opens the check guide then cancels; no confirmation lead is fabricated.');
    // The demo no longer links to the evidence page. It is opened at its own address, which starts a separate app run.
    await send('Page.navigate', { url: 'http://127.0.0.1:4184/evidence' });
    await until(() => evaluate("document.body.innerText.includes('A decision before money leaves')"));
    const expectations = { Problem: 'A decision before money leaves', 'Model evidence': 'AI has not demonstrated superiority', Decision: 'Detect → categorize',
      Trust: 'An explanation tied to the computation', 'Live proof': 'Timing and burden you can inspect' };
    for (const [tab, expected] of Object.entries(expectations)) {
      await click(`Evidence ${tab}`, 'tab', true);
      assert.equal(await evaluate(`document.body.innerText.includes(${JSON.stringify(expected)})`), true);
      await shot(`evidence-${tab.toLowerCase().replaceAll(' ', '-')}.png`);
      checks.push(`Evidence chapter ${tab} renders its required claim and boundary.`);
    }
    await click('Evidence Model evidence', 'tab', true);
    assert.equal(await evaluate("document.body.innerText.includes('6/16 (37.5%)') && document.body.innerText.includes('8/16 (50.0%)') && document.body.innerText.includes('0/60 detected')"), true);
    checks.push('Evidence retains challenge failures, stronger simple comparator and original quiet misses.');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
    await delay(500);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), true);
    await shot('evidence-narrow.png');
    await click('Evidence Live proof', 'tab', true);
    assert.equal(await evaluate("document.body.innerText.includes('0/0 legitimate sessions warned')"), true);
    checks.push('Evidence opened at its own address reports its own empty run and fits narrow web without document overflow.');
    await send('Page.navigate', { url: 'http://127.0.0.1:4184/pitch-manual.html' });
    await until(() => evaluate("document.body.innerText.includes('Four-minute Scam Guardian presentation')"));
    assert.equal(await evaluate("document.body.innerText.includes('Case A fields, all explicit') && document.body.innerText.includes('Case B fields, all explicit')"), true);
    await shot('manual-narrow.png');
    checks.push('Local presenter manual loads complete case fields and spoken timing on narrow web.');
    assert.equal(errors.length, 0, JSON.stringify(errors));
  }
  fs.writeFileSync(path.join(out, 'acceptance.json'), JSON.stringify({ simulationOnly: true, platform: 'headless Edge web; not Android device', checks, sessionReport: report, presenterReport, errors }, null, 2) + '\n');
  fs.copyFileSync(path.join(out, 'acceptance.json'), path.join(base, 'acceptance.json'));
  fs.copyFileSync(exported, path.join(base, 'scam-guardian-warning-metrics.json'));
  console.log(`${checks.length} browser acceptance checks passed. Evidence: ${out}`);
} catch (error) {
  if (socket && sessionId) {
    try { await shot('failure.png'); fs.writeFileSync(path.join(out, 'failure-dom.txt'), await evaluate('document.body.innerText')); } catch {}
  }
  throw error;
} finally {
  if (socket) socket.close();
  for (const promise of pending.values()) { clearTimeout(promise.timer); promise.reject(new Error('Browser closed')); }
  browser.kill(); server.kill();
}
