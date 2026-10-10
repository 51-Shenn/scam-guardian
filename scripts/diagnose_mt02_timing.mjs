/** Probe the frozen MT02 model across authored delivery delays without training or changing thresholds. */
import fs from 'node:fs';
import { assembleBundle } from '../src/domain/bundle.ts';
import { createGuardian } from '../src/domain/guardian.ts';
import { createLocalDemoApi } from '../src/domain/local-api.ts';
import { initialSession, reduce } from '../src/domain/session.ts';

const json = (name) => JSON.parse(fs.readFileSync(new URL(`../src/domain/model/${name}`, import.meta.url), 'utf8'));
const bundle = assembleBundle(json('selection.json'),
  { lr_combined_binary: json('lr_combined_binary.json'), xgb_behavior_binary: json('xgb_behavior_binary.json') },
  { xgb_behavior_binary: json('xgb_behavior_binary.xgb.json') });
const cases = [];
for (const request of ['coached', 'routine']) {
  for (const deliveryMs of [1000, 4000, 6000, 15000, 60000, 120000]) {
    for (const focusAccount of [false, true]) {
      let clock = 0;
      const api = createLocalDemoApi({ clock: () => clock, loadBundle: async () => bundle, availability: { editing: true, explicitPaste: true } });
      const guardian = createGuardian({ api, platform: 'web', appBuild: 'mt02-diagnostic', localUserKey: 'authored-probe', newId: () => 'authored-session' });
      let session = initialSession;
      const act = (action) => {
        const next = reduce(session, action);
        guardian.observe(action, session, next);
        session = next;
      };
      act({ type: 'selectRequest', request });
      act({ type: 'transfer' });
      act({ type: 'agree' });
      act({ type: 'pick', to: 'fresh' });
      if (focusAccount) guardian.focus('recipient', true);
      const predictions = [];
      for (clock = 1000; clock <= deliveryMs + 15000; clock += 1000) {
        const view = await guardian.predictDue();
        if (view) {
          act({ type: 'ai', ai: view, now: clock });
          if (view.cutoff >= deliveryMs) predictions.push({ cutoff: view.cutoff, model: view.model, score: view.score, threshold: view.threshold, latched: view.latched });
        }
        if (clock === deliveryMs) act({ type: 'revealRequest' });
      }
      cases.push({ request, deliveryMs, focusAccount, review: session.ai.latched, predictions });
    }
  }
}
const out = new URL('../data/processed/mt02-timing-diagnostic.json', import.meta.url);
fs.mkdirSync(new URL('./', out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ simulated: true, purpose: 'Frozen-model timing diagnosis, not held-out accuracy or a human-session result', cases }, null, 2) + '\n');
for (const c of cases) console.log(JSON.stringify({ request: c.request, deliveryMs: c.deliveryMs, focusAccount: c.focusAccount, review: c.review, last: c.predictions.at(-1) }));
