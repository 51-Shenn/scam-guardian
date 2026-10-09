// Mock wallet for the v2 design samples. No real money moves; call and paste signals are simulated.
// The rules below mirror src/domain/risk.ts. They are demonstration rules, not a trained model.
(() => {
  const mount = document.querySelector('[data-wallet]');
  if (!mount) return;
  const screen = mount.closest('.screen');
  const island = document.querySelector('.island');
  const COOL_DOWN = 10; // the app pauses for 30 seconds; the sample shortens it so three directions can be compared quickly
  const USUAL = 50;
  const money = (n) => 'RM ' + Number(n).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fixtures = {
    normal: { label: 'Normal', amount: '50', to: 'aina', call: false, paste: false, back: 0, note: 'Saved contact, usual amount' },
    struggling: { label: 'Struggling', amount: '50', to: 'aina', call: false, paste: false, back: 3, note: 'Repeated back navigation' },
    medium: { label: 'Coached, medium', amount: '100', to: 'fresh', call: true, paste: false, back: 0, note: 'Call active, new recipient' },
    coached: { label: 'Coached, high', amount: '1200', to: 'fresh', call: true, paste: true, back: 0, note: 'Call active, new recipient, pasted account' },
  };
  const people = {
    aina: { name: 'Aina', meta: 'Daughter, saved contact', initial: 'A' },
    hafiz: { name: 'Hafiz', meta: 'Saved contact', initial: 'H' },
    fresh: { name: 'New recipient', meta: 'Demo account ending 8830', initial: '', fresh: true },
  };
  const s = { step: 'home', scenario: 'normal', consent: false, family: false, asked: false, balance: 2500, amount: '50', to: 'aina', help: 0, back: 0, deadline: null, sheet: null, hidden: false, error: '', hint: false };
  let shown = { step: '', sheet: null }, toastTimer = 0, tick = 0, callStart = Date.now();

  function evaluate(x) {
    if (x.callActive && x.newRecipient && (x.pasted || x.amountRatio > 3)) return { classification: 'Coached', response: 'hold', reasons: ['Call signal is active', 'This is a new recipient', x.pasted ? 'Account paste flag is present' : 'Amount exceeds 3x the usual transfer'] };
    if (x.callActive && x.newRecipient) return { classification: 'Coached', response: 'cooldown', reasons: ['Call signal is active', 'This is a new recipient'] };
    if (x.backPresses >= 3 || x.helpTaps >= 2) return { classification: 'Struggling', response: 'guide', reasons: ['Extra navigation or help requests', 'Step-by-step guidance may help'] };
    return { classification: 'Normal', response: 'continue', reasons: ['No demonstration rule requires an intervention'] };
  }
  function invalid() {
    if (!/^\d+(\.\d{1,2})?$/.test(s.amount)) return 'Enter an amount with up to two decimal places.';
    const n = Number(s.amount);
    if (n <= 0) return 'Enter an amount greater than RM0.';
    if (n > s.balance) return 'This amount exceeds the demo balance.';
    return '';
  }
  function derive() {
    const f = fixtures[s.scenario];
    const active = ['recipient', 'amount', 'review'].includes(s.step);
    const signals = { callActive: f.call, newRecipient: !!people[s.to].fresh, pasted: f.paste, amountRatio: Number(s.amount) / USUAL, backPresses: s.back + f.back, helpTaps: s.help };
    const monitoring = s.consent && active;
    const decision = monitoring ? evaluate(signals) : { classification: 'Inactive', response: 'continue', reasons: [s.consent ? 'Monitoring starts at the recipient step' : 'Guardian is off for this wallet'] };
    const simple = active && (decision.response === 'guide' || s.help > 0);
    const paused = s.deadline !== null || decision.response === 'hold' || decision.response === 'cooldown';
    const remaining = s.deadline ? Math.max(0, Math.ceil((s.deadline - Date.now()) / 1000)) : 0;
    return { f, active, signals, monitoring, decision, simple, paused, remaining };
  }

  const ico = (name, fill) => `<i class="${fill ? 'ph-fill' : 'ph'} ph-${name}" aria-hidden="true"></i>`;
  const bar = (title, n) => `<header class="w-bar"><button class="w-icon" data-act="back" aria-label="Go back">${ico('caret-left')}</button><h2>${title}</h2></header>
    <div class="w-steps" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'done' : ''}"></i>`).join('')}</div>`;
  const guide = (text) => `<div class="w-guide">${ico('lightbulb')}<span>${text}</span></div>`;
  const links = () => `<div class="w-links"><button class="w-btn quiet" data-act="help">${ico('lifebuoy')}Help me with this step</button><button class="w-btn quiet" data-act="cancel">Cancel</button></div>`;

  const views = {
    home: (d) => `<div class="scroll"><div class="w-hero">
        <div class="w-top"><span class="w-avatar" aria-hidden="true">R</span><span class="who">Selamat datang<b>Rohani</b></span>
          <button class="w-icon" data-act="soon" aria-label="Notifications">${ico('bell')}</button>
          <button class="w-icon w-exit" data-act="exit" aria-label="Close the wallet demo">${ico('x')}</button></div>
        <div class="w-balance"><div class="label">Demo balance<button data-act="eye" aria-label="${s.hidden ? 'Show' : 'Hide'} balance">${ico(s.hidden ? 'eye-slash' : 'eye')}</button></div>
          <div class="sum">${s.hidden ? 'RM ••••' : money(s.balance)}</div>
          <div class="row"><button class="w-pill reload" data-act="soon">${ico('plus')}Reload</button>
            <button class="w-pill guardian ${s.consent ? 'on' : ''}" data-act="guardian">${ico('shield-check', s.consent)}Guardian ${s.consent ? 'on' : 'off'}</button></div></div></div>
      <div class="w-quick">${[['scan', 'Scan'], ['qr-code', 'Pay'], ['arrows-left-right', 'Transfer'], ['credit-card', 'Cards']].map(([i, l]) => `<button data-act="${l === 'Transfer' ? 'transfer' : 'soon'}" class="${l === 'Transfer' && s.hint ? 'hint' : ''}"><span class="ico">${ico(i)}</span>${l}</button>`).join('')}</div>
      <div class="w-grid">${[['car-profile', 'Toll'], ['letter-circle-p', 'Parking'], ['receipt', 'Bills'], ['device-mobile', 'Prepaid'], ['umbrella', 'Insurance'], ['chart-line-up', 'Invest'], ['gift', 'Rewards'], ['dots-nine', 'More']].map(([i, l]) => `<button data-act="soon"><span class="ico">${ico(i)}</span>${l}</button>`).join('')}</div>
      <div class="w-note">${ico('shield-check')}<span><b>This is a demo wallet</b>No real money moves. Scenario: ${d.f.label.toLowerCase()}. Tap Transfer to begin.</span></div></div>
      <nav class="w-tabs" aria-label="Wallet sections"><button class="on" aria-current="page">${ico('house', true)}Home</button><button data-act="soon">${ico('storefront')}Shop</button>
        <button class="scan" data-act="soon" aria-label="Scan"><span class="ico">${ico('scan')}</span></button><button data-act="soon">${ico('wallet')}Finance</button><button data-act="soon">${ico('user')}Profile</button></nav>`,
    recipient: (d) => `${bar('Transfer', 1)}<div class="scroll"><div class="w-body">
        ${d.simple ? guide('Choose the person you want to send to. Then press Next.') : ''}
        <h3>Who are you sending to?</h3><p class="sub">Pick a saved contact or a new recipient.</p>
        ${Object.entries(people).map(([k, p]) => `<button class="w-person" data-to="${k}" aria-pressed="${s.to === k}"><span class="av ${p.fresh ? 'new' : ''}" aria-hidden="true">${p.fresh ? ico('user-plus') : p.initial}</span>
          <span><span class="name">${p.name}</span><br><span class="meta">${p.meta}</span>${p.fresh && d.f.paste ? `<br><span class="w-tag">${ico('clipboard-text')}Pasted, simulated</span>` : ''}</span>${ico('check-circle', true).replace('class="', 'class="tick ')}</button>`).join('')}
      </div></div><div class="w-foot"><button class="w-btn" data-act="next">Next</button>${links()}</div>`,
    amount: (d) => `${bar('Transfer', 2)}<div class="scroll"><div class="w-body">
        ${d.simple ? guide('Enter the amount in ringgit. Then press Review.') : ''}
        <div class="w-amount"><span class="to">To ${people[s.to].name}${people[s.to].fresh ? '<span class="w-tag">New</span>' : ''}</span>
          <output aria-live="polite"><small>RM</small>${s.amount || '0'}</output><span class="avail">Available ${money(s.balance)}</span></div>
        <p class="w-error" role="alert">${s.error}</p>
        <div class="w-chips">${[10, 50, 100].map((n) => `<button data-set="${n}">RM ${n}</button>`).join('')}</div></div>
        <div class="w-keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'].map((k) => `<button data-key="${k}" aria-label="${k === 'del' ? 'Delete' : k === '.' ? 'Decimal point' : k}">${k === 'del' ? ico('backspace') : k}</button>`).join('')}</div>
      </div><div class="w-foot"><button class="w-btn" data-act="review">Review</button>${links()}</div>`,
    review: (d) => `${bar('Review', 3)}<div class="scroll"><div class="w-body">
        ${d.simple ? guide('Check the person and the amount. Confirm only when both are right.') : ''}
        <h3>${d.paused ? 'Take a moment' : 'Check your transfer'}</h3>
        <div class="w-rows"><div><span>To</span>${people[s.to].name}</div><div><span>Amount</span><b class="big" style="font-weight:400">${money(s.amount)}</b></div><div><span>Fee</span>RM 0.00</div><div><span>From</span>Demo balance</div></div>
        ${d.paused ? `<div class="w-pause"><div class="ring"><svg viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="34"/><circle class="go" cx="38" cy="38" r="34" stroke-dasharray="213.6" stroke-dashoffset="0"/></svg><b data-count aria-hidden="true">${d.remaining}</b></div>
          <p data-pause-text>${d.remaining ? 'A short pause before you decide.' : 'The pause has ended. The choice is yours.'}</p></div>` : ''}
      </div></div><div class="w-foot"><button class="w-btn" data-act="confirm" ${d.paused && d.remaining ? 'disabled' : ''}>${d.paused ? 'Continue with transfer' : 'Confirm transfer'}</button>${links()}</div>`,
    success: () => `<div class="w-done">${ico('check-circle', true)}<h3>Demo transfer complete</h3><p>${money(s.amount)} to ${people[s.to].name}. Your mock balance is now ${money(s.balance)}. No real funds were sent.</p></div>
      <div class="w-foot"><button class="w-btn" data-act="home">Done</button></div>`,
  };
  const sheets = {
    consent: () => `<h3>Turn on Guardian for transfers?</h3><p>It watches one transfer at a time, from choosing a recipient until you confirm or cancel.</p>
      <ul><li>${ico('microphone-slash')}No call audio and no caller identity.</li><li>${ico('clipboard')}No clipboard contents. Only whether something was pasted.</li><li>${ico('hand-palm')}It can pause a transfer. It never blocks your decision.</li></ul>
      <button class="w-toggle" role="switch" aria-checked="${s.family}" data-act="family"><span class="sw"></span><span>Let Aina be asked to call me if a transfer is paused. No amount or account details are shared.</span></button>
      <button class="w-btn" data-act="agree">Agree and turn on</button><button class="w-btn quiet" data-act="decline">${s.consent ? 'Turn Guardian off' : 'Not now'}</button>`,
    pause: (d) => `<h3>Is someone on the phone telling you to do this?</h3><p>Take time to check with someone you trust. You can cancel now, or decide to continue after the pause.</p>
      ${s.family && d.decision.response === 'hold' ? `<div class="w-alert"><span>Alert preview for Aina: "A transfer was paused. Please call your family member to check in."</span><small>Preview only. Nothing was sent to another device.</small></div>` : ''}
      <button class="w-btn" data-act="cancel">Cancel this transfer</button><button class="w-btn line" data-act="sheet-close">I want to review it myself</button>`,
  };

  // Rebuilds the screen. Only a step change replays the push transition; only a new sheet replays the rise.
  function render() {
    const d = derive();
    const scroll = mount.querySelector('.scroll')?.scrollTop ?? 0;
    const focus = mount.contains(document.activeElement) ? document.activeElement : null;
    const focusKey = focus && ['act', 'to', 'key', 'set'].map((k) => focus.dataset[k] && `[data-${k}="${focus.dataset[k]}"]`).find(Boolean);
    mount.innerHTML = `<div class="view ${s.step}">${views[s.step](d)}</div>` + (s.sheet ? `<div class="w-scrim" ${s.sheet === 'pause' ? '' : 'data-act="sheet-close"'}></div><div class="w-sheet" role="dialog" aria-modal="true">${sheets[s.sheet](d)}</div>` : '');
    if (shown.step === s.step) {
      mount.querySelector('.view').style.animation = 'none';
      const area = mount.querySelector('.scroll');
      if (area) area.scrollTop = scroll;
    }
    if (s.sheet && shown.sheet === s.sheet) mount.querySelectorAll('.w-sheet, .w-scrim').forEach((el) => { el.style.animation = 'none'; });
    if (focusKey) mount.querySelector(focusKey)?.focus({ preventScroll: true });
    shown = { step: s.step, sheet: s.sheet };
    mount.classList.toggle('simple', d.simple);
    screen.dataset.chrome = s.step === 'home' ? 'light' : 'dark';
    island.classList.toggle('live', d.f.call);
    publish(d);
    if (s.step === 'review' && s.deadline) countdown();
  }
  function publish(d) {
    const signalList = [['Call', d.f.call ? 'Active (simulated)' : 'None'], ['Recipient', d.active ? (d.signals.newRecipient ? 'New' : 'Saved') : 'Not chosen'], ['Paste flag', d.f.paste ? 'Present (simulated)' : 'None'],
      ['Amount', d.active ? `${(d.signals.amountRatio || 0).toFixed(1)}x usual` : 'Not entered'], ['Back steps', String(d.signals.backPresses)], ['Help taps', String(d.signals.helpTaps)]];
    document.querySelectorAll('[data-readout]').forEach((el) => {
      el.dataset.state = d.decision.classification.toLowerCase();
      el.innerHTML = `<p class="ro-label">Guardian read-out</p><p class="ro-class">${d.monitoring ? d.decision.classification : 'Monitoring inactive'}</p>
        <ul class="ro-reasons">${d.decision.reasons.map((r) => `<li>${r}</li>`).join('')}</ul>
        <dl class="ro-signals">${signalList.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
        <p class="ro-note">Demonstration rules, not model output.</p>`;
    });
    document.querySelectorAll('[data-scenario]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scenario === s.scenario)));
    document.dispatchEvent(new CustomEvent('guardian:state', { detail: { step: s.step, scenario: s.scenario, classification: d.decision.classification, response: d.decision.response, monitoring: d.monitoring, paused: d.paused && s.step === 'review', remaining: d.remaining, call: d.f.call } }));
  }
  function toast(text) {
    mount.querySelector('.w-toast')?.remove();
    mount.insertAdjacentHTML('beforeend', `<div class="w-toast" role="status">${text}</div>`);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => mount.querySelector('.w-toast')?.remove(), 1800);
  }
  function countdown() {
    clearInterval(tick);
    tick = setInterval(() => {
      const d = derive();
      const count = mount.querySelector('[data-count]');
      if (s.step !== 'review' || !count) return clearInterval(tick);
      count.textContent = d.remaining;
      mount.querySelector('circle.go').style.strokeDashoffset = String(213.6 * (1 - d.remaining / COOL_DOWN));
      publish(d);
      if (!d.remaining) { clearInterval(tick); mount.querySelector('[data-pause-text]').textContent = 'The pause has ended. The choice is yours.'; mount.querySelector('[data-act="confirm"]').disabled = false; }
    }, 250);
  }
  function start() {
    const f = fixtures[s.scenario];
    Object.assign(s, { amount: f.amount, to: f.to, help: 0, back: 0, deadline: null, error: '', sheet: null, step: 'recipient', hint: false });
  }
  function reset() { clearInterval(tick); Object.assign(s, { step: 'home', deadline: null, error: '', sheet: null }); }

  const actions = {
    soon: () => toast('Not part of this demo'),
    eye: () => { s.hidden = !s.hidden; },
    exit: () => document.body.classList.remove('wallet-open'),
    guardian: () => { s.sheet = 'consent'; },
    transfer: () => { if (s.asked) start(); else s.sheet = 'consent'; s.pending = !s.asked; },
    family: () => { s.family = !s.family; },
    agree: () => { s.consent = true; s.asked = true; s.sheet = null; if (s.pending) start(); s.pending = false; },
    decline: () => { s.consent = false; s.family = false; s.asked = true; s.sheet = null; if (s.pending) start(); s.pending = false; },
    'sheet-close': () => { s.sheet = null; s.pending = false; },
    next: () => { s.step = 'amount'; },
    review: () => {
      s.error = invalid();
      if (s.error) return;
      s.step = 'review';
      const d = derive();
      if (d.paused && s.deadline === null) { s.deadline = Date.now() + COOL_DOWN * 1000; s.sheet = 'pause'; }
    },
    confirm: () => {
      const d = derive();
      if (d.paused && d.remaining) return;
      s.error = invalid();
      if (s.error) { s.step = 'amount'; return; }
      s.balance -= Number(s.amount); s.deadline = null; s.step = 'success';
    },
    back: () => { s.back += 1; s.error = ''; s.step = s.step === 'review' ? 'amount' : s.step === 'amount' ? 'recipient' : 'home'; if (s.step === 'home') reset(); },
    help: () => { s.help += 1; },
    cancel: () => { reset(); },
    home: () => { reset(); },
  };
  function key(k) {
    if (s.step !== 'amount') return;
    s.error = '';
    if (k === 'del') s.amount = s.amount.slice(0, -1);
    else if (k === '.') { if (!s.amount.includes('.')) s.amount = (s.amount || '0') + '.'; }
    else if (!/\.\d\d$/.test(s.amount) && s.amount.length < 8) s.amount = s.amount === '0' ? k : s.amount + k;
  }
  mount.addEventListener('click', (event) => {
    const el = event.target.closest('[data-act], [data-to], [data-key], [data-set]');
    if (!el || !mount.contains(el)) return;
    if (el.dataset.to) s.to = el.dataset.to;
    else if (el.dataset.key) key(el.dataset.key);
    else if (el.dataset.set) { s.amount = el.dataset.set; s.error = ''; }
    else if (el.dataset.act === 'soon') return actions.soon();
    else if (actions[el.dataset.act]) actions[el.dataset.act]();
    else return;
    render();
  });
  document.addEventListener('keydown', (event) => {
    if (s.step !== 'amount' || !mount.contains(document.activeElement) && document.activeElement !== document.body) return;
    const k = event.key === 'Backspace' ? 'del' : /^[\d.]$/.test(event.key) ? event.key : null;
    if (!k) return;
    key(k); render();
  });

  // Page-level controls: scenario switches and "open the wallet" buttons live outside the phone.
  function setScenario(name) {
    if (!fixtures[name]) return;
    reset(); s.scenario = name; s.hint = true; callStart = Date.now(); render();
  }
  document.addEventListener('click', (event) => {
    const pick = event.target.closest('[data-scenario]');
    if (pick) { setScenario(pick.dataset.scenario); if (pick.dataset.open !== undefined) open(); }
    if (event.target.closest('[data-open-wallet]')) open();
  });
  const narrow = matchMedia('(max-width: 859px)');
  function open() {
    if (narrow.matches) document.body.classList.add('wallet-open');
    else document.querySelector('.device-fit').scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function fit() {
    const box = document.querySelector('.device-fit');
    const scale = narrow.matches ? Math.min(340, innerWidth - 56) / 468 : Math.min(innerHeight * 0.84, 840) / 984;
    document.documentElement.style.setProperty("--s", Math.max(0.5, scale).toFixed(4));
  }
  addEventListener('resize', fit);
  setInterval(() => {
    const t = island.querySelector('time');
    const sec = Math.floor((Date.now() - callStart) / 1000);
    if (t) t.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  }, 1000);
  island.innerHTML = `${ico('phone-call', true)}<span>Simulated call</span><time>00:00</time>`;
  fit(); render();
  window.GuardianDemo = { setScenario, open };
})();
