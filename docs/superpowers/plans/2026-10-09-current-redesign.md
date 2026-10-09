# Current Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Scam Guardian landing page and mock wallet as direction A, "Current", for Android and web together.

**Architecture:** A pure session reducer in `src/domain` holds all wallet state. One React context shares it with the wallet views, the demo console and the page art. The wallet views are shared React Native + NativeWind; a shared phone frame wraps them on desktop web and becomes a tap-through preview on narrow web and Android.

**Tech Stack:** Expo SDK 57, Expo Router, React Native 0.86, NativeWind 5 RC / Tailwind 4, Reanimated 4.5, react-native-svg, expo-linear-gradient, phosphor-react-native, beUI (web Button and Switch).

**Spec:** [2026-10-09-current-redesign-design.md](../specs/2026-10-09-current-redesign-design.md). **Visual reference:** [design/v2/current.html](../../../design/v2/current.html).

**Conventions for every task**
- A code block introduced by `<!-- file: path -->` is the complete content of that file. Write it exactly.
- No unit-test harness exists for components (only `node --test` for `src/domain`). Components are verified by `npm run typecheck`, `npm run lint`, and the browser and emulator checks in Task 13. Do not add a component test framework.
- Commit with Conventional Commits. Never push.
- Visible copy contains no em dashes or en dashes.

**One deviation from the spec:** the spec named a beUI Bottom Sheet for web. beUI's sheet portals to `<body>` and pins to the browser viewport, so it cannot open inside the phone frame. The sheet is therefore one shared in-wallet component (Task 4). beUI still supplies the web Button and Switch.

---

## File map

| Path | Responsibility |
|---|---|
| `src/domain/session.ts` | Wallet session reducer, fixtures, `derive`, `money` |
| `src/domain/session.test.ts` | Reducer tests |
| `src/constants/layout.ts` | Breakpoints and frame dimensions |
| `src/hooks/use-viewport.ts`, `.web.ts` | Window size, hydration-safe on web |
| `src/components/wallet/session.tsx` | Context provider and pause timer |
| `src/components/wallet/icons.ts` | The only file that imports Phosphor |
| `src/components/wallet/palette.ts` | Wallet colours for props that cannot take a class |
| `src/components/wallet/button.tsx` | Wallet button |
| `src/components/wallet/sheet.tsx` | In-wallet bottom sheet |
| `src/components/wallet/toggle.tsx`, `.web.tsx`, `toggle.types.ts` | Switch pair (native / beUI) |
| `src/components/beui/switch.web.tsx` | beUI Switch source, unmodified |
| `src/components/wallet/step-chrome.tsx` | Step header, progress, tag, guidance banner, footer |
| `src/components/wallet/home.tsx` | Wallet home |
| `src/components/wallet/recipient.tsx` | Step 1 |
| `src/components/wallet/keypad.tsx`, `use-amount-keys.ts`, `.web.ts` | Keypad and hardware-keyboard entry |
| `src/components/wallet/amount.tsx` | Step 2 |
| `src/components/wallet/pause-ring.tsx` | Countdown ring |
| `src/components/wallet/review.tsx` | Step 3 |
| `src/components/wallet/success.tsx` | Completion |
| `src/components/wallet/sheets.tsx` | Consent and pause sheet contents |
| `src/components/wallet/wallet.tsx` | Picks the view, plays transitions, owns the toast |
| `src/components/guardian/phone-frame.tsx` | Phone frame, status row, island |
| `src/components/guardian/flow-art.tsx`, `.web.tsx`, `flow-art.types.ts` | Page art |
| `src/components/guardian/demo-console.tsx` | Scenario switch and read-out |
| `src/components/guardian/wordmark.tsx` | Shield and name, used in both navs |
| `src/components/guardian/lock-figure.tsx`, `.web.tsx` | Canal-lock figure |
| `src/components/guardian/reveal.tsx`, `.web.tsx` | Scroll reveal |
| `src/components/guardian/action.*` | Landing buttons (existing pair, restyled) |
| `src/screens/landing.tsx`, `src/screens/wallet.tsx` | Screen composition |
| `scripts/build-native-art.mjs` | Generates `assets/guardian/current.svg` |

---

### Task 1: Dependencies and the icon gate

The spec says: if Phosphor does not install cleanly on SDK 57, stop and ask the user.

**Files:**
- Modify: `package.json` (through the installer only)
- Create: `src/components/wallet/icons.ts`

- [ ] **Step 1: Install**

Run: `npx expo install react-native-svg expo-linear-gradient phosphor-react-native`
Expected: exits 0. `package.json` gains `react-native-svg` at `15.15.4`, `expo-linear-gradient` at `~57.0.2`, and `phosphor-react-native`.

- [ ] **Step 2: Check the dependency graph**

Run: `npx expo-doctor`
Expected: no new failures caused by these three packages. If it reports one, stop and report it to the user.

- [ ] **Step 3: Write the icon module**

Deep imports keep the other 1,500 icons out of the bundle.

<!-- file: src/components/wallet/icons.ts -->
```ts
// The only module that imports Phosphor. Deep imports avoid bundling the full icon set.
export { AppWindowIcon } from 'phosphor-react-native/src/icons/AppWindow';
export { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
export { ArrowsLeftRightIcon } from 'phosphor-react-native/src/icons/ArrowsLeftRight';
export { ArrowUpRightIcon } from 'phosphor-react-native/src/icons/ArrowUpRight';
export { BackspaceIcon } from 'phosphor-react-native/src/icons/Backspace';
export { BatteryFullIcon } from 'phosphor-react-native/src/icons/BatteryFull';
export { BellIcon } from 'phosphor-react-native/src/icons/Bell';
export { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
export { CarProfileIcon } from 'phosphor-react-native/src/icons/CarProfile';
export { CellSignalFullIcon } from 'phosphor-react-native/src/icons/CellSignalFull';
export { ChartLineUpIcon } from 'phosphor-react-native/src/icons/ChartLineUp';
export { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
export { ClipboardIcon } from 'phosphor-react-native/src/icons/Clipboard';
export { ClipboardTextIcon } from 'phosphor-react-native/src/icons/ClipboardText';
export { CreditCardIcon } from 'phosphor-react-native/src/icons/CreditCard';
export { DeviceMobileIcon } from 'phosphor-react-native/src/icons/DeviceMobile';
export { DotsNineIcon } from 'phosphor-react-native/src/icons/DotsNine';
export { EyeIcon } from 'phosphor-react-native/src/icons/Eye';
export { EyeSlashIcon } from 'phosphor-react-native/src/icons/EyeSlash';
export { GiftIcon } from 'phosphor-react-native/src/icons/Gift';
export { HandPalmIcon } from 'phosphor-react-native/src/icons/HandPalm';
export { HouseIcon } from 'phosphor-react-native/src/icons/House';
export { LetterCirclePIcon } from 'phosphor-react-native/src/icons/LetterCircleP';
export { LifebuoyIcon } from 'phosphor-react-native/src/icons/Lifebuoy';
export { LightbulbIcon } from 'phosphor-react-native/src/icons/Lightbulb';
export { MicrophoneSlashIcon } from 'phosphor-react-native/src/icons/MicrophoneSlash';
export { PhoneCallIcon } from 'phosphor-react-native/src/icons/PhoneCall';
export { PhoneSlashIcon } from 'phosphor-react-native/src/icons/PhoneSlash';
export { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
export { QrCodeIcon } from 'phosphor-react-native/src/icons/QrCode';
export { ReceiptIcon } from 'phosphor-react-native/src/icons/Receipt';
export { ScanIcon } from 'phosphor-react-native/src/icons/Scan';
export { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck';
export { StorefrontIcon } from 'phosphor-react-native/src/icons/Storefront';
export { UmbrellaIcon } from 'phosphor-react-native/src/icons/Umbrella';
export { UserIcon } from 'phosphor-react-native/src/icons/User';
export { UserPlusIcon } from 'phosphor-react-native/src/icons/UserPlus';
export { WalletIcon } from 'phosphor-react-native/src/icons/Wallet';
export { WifiHighIcon } from 'phosphor-react-native/src/icons/WifiHigh';
export { XIcon } from 'phosphor-react-native/src/icons/X';
export type { Icon } from 'phosphor-react-native';
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.
If the deep imports fail to resolve, replace every line with one root import, `export { AppWindowIcon, ArrowRightIcon, ... } from 'phosphor-react-native';`, keeping the same exported names, and rerun. If that also fails, stop and report to the user.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/components/wallet/icons.ts
git commit -m "chore: add svg, gradient and Phosphor icon dependencies"
```

---

### Task 2: Session reducer

**Files:**
- Create: `src/domain/session.ts`
- Test: `src/domain/session.test.ts`

- [ ] **Step 1: Write the failing tests**

<!-- file: src/domain/session.test.ts -->
```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { COOL_DOWN_MS, derive, initialSession, money, reduce, type Action, type Session } from './session.ts';

const run = (session: Session, ...actions: Action[]) => actions.reduce(reduce, session);
const consented = (scenario: Session['scenario']) => run(initialSession, { type: 'scenario', scenario }, { type: 'transfer' }, { type: 'agree' });

test('the first transfer asks for consent, then starts from the fixture', () => {
  const asked = run(initialSession, { type: 'transfer' });
  assert.equal(asked.sheet, 'consent');
  assert.equal(asked.step, 'home');
  const started = run(asked, { type: 'agree' });
  assert.deepEqual([started.step, started.consent, started.sheet, started.to, started.amount], ['recipient', true, null, 'aina', '50']);
  assert.equal(run(started, { type: 'cancel' }, { type: 'transfer' }).step, 'recipient', 'consent is asked once');
});

test('a normal transfer completes without a pause', () => {
  const review = run(consented('normal'), { type: 'next' }, { type: 'review', now: 1000 });
  assert.deepEqual([review.step, review.deadline, review.sheet], ['review', null, null]);
  const done = run(review, { type: 'confirm', now: 1001 });
  assert.deepEqual([done.step, done.balance], ['success', 2450]);
});

test('a coached transfer pauses for the full cool-down and cannot be confirmed early', () => {
  const review = run(consented('coached'), { type: 'next' }, { type: 'review', now: 1000 });
  assert.deepEqual([review.step, review.deadline, review.sheet], ['review', 1000 + COOL_DOWN_MS, 'pause']);
  assert.equal(derive(review, 1000).remaining, 30);
  assert.equal(derive(review, 1000).locked, true);
  assert.equal(run(review, { type: 'confirm', now: 1000 + COOL_DOWN_MS - 1 }), review);
  const done = run(review, { type: 'confirm', now: 1000 + COOL_DOWN_MS });
  assert.deepEqual([done.step, done.balance, done.deadline], ['success', 1300, null]);
});

test('the pause deadline survives back navigation and a recipient change', () => {
  const review = run(consented('coached'), { type: 'next' }, { type: 'review', now: 1000 });
  const again = run(review, { type: 'back' }, { type: 'back' }, { type: 'pick', to: 'aina' }, { type: 'next' }, { type: 'review', now: 9000 });
  assert.equal(again.deadline, 1000 + COOL_DOWN_MS);
  assert.equal(derive(again, 9000).paused, true);
});

test('without consent nothing is monitored and nothing pauses', () => {
  const started = run(initialSession, { type: 'scenario', scenario: 'coached' }, { type: 'transfer' }, { type: 'decline' });
  assert.equal(derive(started, 0).monitoring, false);
  const review = run(started, { type: 'next' }, { type: 'review', now: 1000 });
  assert.deepEqual([review.deadline, derive(review, 1000).paused], [null, false]);
});

test('struggling switches to simple mode; a help tap does so in any scenario', () => {
  assert.equal(derive(consented('struggling'), 0).simple, true);
  assert.equal(derive(consented('struggling'), 0).decision.classification, 'Struggling');
  assert.equal(derive(consented('normal'), 0).simple, false);
  assert.equal(derive(run(consented('normal'), { type: 'help' }), 0).simple, true);
  assert.equal(derive(initialSession, 0).simple, false, 'never on the home screen');
});

test('the family alert preview needs separate consent and a hold', () => {
  const withFamily = (scenario: Session['scenario']) => run(initialSession, { type: 'scenario', scenario }, { type: 'transfer' }, { type: 'toggleFamily' }, { type: 'agree' }, { type: 'next' }, { type: 'review', now: 0 });
  assert.equal(derive(withFamily('coached'), 0).alert, true);
  assert.equal(derive(withFamily('medium'), 0).alert, false);
  assert.equal(derive(run(consented('coached'), { type: 'next' }, { type: 'review', now: 0 }), 0).alert, false);
  assert.equal(run(initialSession, { type: 'toggleFamily' }, { type: 'decline' }).family, false, 'declining clears it');
});

test('keypad entry keeps a valid amount shape', () => {
  const amount = run(consented('normal'), { type: 'next' }, { type: 'key', key: 'del' }, { type: 'key', key: 'del' });
  assert.equal(amount.amount, '');
  const typed = run(amount, { type: 'key', key: '0' }, { type: 'key', key: '7' }, { type: 'key', key: '.' }, { type: 'key', key: '.' }, { type: 'key', key: '2' }, { type: 'key', key: '5' }, { type: 'key', key: '9' });
  assert.equal(typed.amount, '7.25');
  assert.equal(run(amount, { type: 'key', key: '.' }).amount, '0.');
  assert.equal(run(typed, { type: 'setAmount', amount: '100' }).amount, '100');
});

test('an invalid amount stays on the amount step with a message', () => {
  const over = run(consented('normal'), { type: 'next' }, { type: 'setAmount', amount: '9999' }, { type: 'review', now: 0 });
  assert.deepEqual([over.step, over.error], ['amount', 'This amount exceeds the demo balance.']);
  assert.equal(run(over, { type: 'key', key: 'del' }).error, null);
});

test('back steps are counted and leaving the recipient step ends the session', () => {
  const amount = run(consented('normal'), { type: 'next' });
  assert.deepEqual([run(amount, { type: 'back' }).step, run(amount, { type: 'back' }).back], ['recipient', 1]);
  assert.equal(run(amount, { type: 'back' }, { type: 'back' }).step, 'home');
});

test('changing scenario cancels the transfer and clears the pause', () => {
  const review = run(consented('coached'), { type: 'next' }, { type: 'review', now: 0 });
  const changed = run(review, { type: 'scenario', scenario: 'normal' });
  assert.deepEqual([changed.step, changed.deadline, changed.sheet, changed.scenario], ['home', null, null, 'normal']);
});

test('remaining time and ring fraction are clamped', () => {
  const review = run(consented('coached'), { type: 'next' }, { type: 'review', now: 1000 });
  assert.deepEqual([derive(review, 0).remaining, derive(review, 0).fraction], [30, 1]);
  assert.deepEqual([derive(review, 16000).remaining, derive(review, 16000).fraction], [15, 0.5]);
  assert.deepEqual([derive(review, 99000).remaining, derive(review, 99000).fraction, derive(review, 99000).locked], [0, 0, false]);
});

test('money formats ringgit with separators and two decimals', () => {
  assert.equal(money(2500), 'RM 2,500.00');
  assert.equal(money('50.2'), 'RM 50.20');
  assert.equal(money(''), 'RM 0.00');
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npm test`
Expected: FAIL. `session.test.ts` cannot find module `./session.ts`. The six `risk.test.ts` tests still pass.

- [ ] **Step 3: Write the reducer**

<!-- file: src/domain/session.ts -->
```ts
import { canConfirm, evaluate, validateAmount, type Decision, type Scenario, type Signals } from './risk.ts';

export type Step = 'home' | 'recipient' | 'amount' | 'review' | 'success';
export type RecipientId = 'aina' | 'hafiz' | 'fresh';
export type SheetName = 'consent' | 'pause';

export const COOL_DOWN_MS = 30000;
export const USUAL_AMOUNT = 50;

// Fixtures are demo signals. Nothing here is observed from the device.
export interface Fixture { label: string; note: string; amount: string; to: RecipientId; call: boolean; paste: boolean; back: number }
export const fixtures: Record<Scenario, Fixture> = {
  normal: { label: 'Normal', note: 'Saved contact, usual amount', amount: '50', to: 'aina', call: false, paste: false, back: 0 },
  struggling: { label: 'Struggling', note: 'Repeated back navigation', amount: '50', to: 'aina', call: false, paste: false, back: 3 },
  medium: { label: 'Coached', note: 'Call active, new recipient', amount: '100', to: 'fresh', call: true, paste: false, back: 0 },
  coached: { label: 'Coached, high', note: 'Call active, new recipient, pasted account', amount: '1200', to: 'fresh', call: true, paste: true, back: 0 },
};
export const scenarios = Object.keys(fixtures) as Scenario[];

export interface Recipient { name: string; meta: string; initial: string; fresh: boolean }
export const recipients: Record<RecipientId, Recipient> = {
  aina: { name: 'Aina', meta: 'Daughter, saved contact', initial: 'A', fresh: false },
  hafiz: { name: 'Hafiz', meta: 'Saved contact', initial: 'H', fresh: false },
  fresh: { name: 'New recipient', meta: 'Demo account ending 8830', initial: '', fresh: true },
};
export const recipientIds = Object.keys(recipients) as RecipientId[];

export interface Session {
  step: Step;
  scenario: Scenario;
  consent: boolean;
  family: boolean;
  asked: boolean;
  pendingStart: boolean;
  balance: number;
  amount: string;
  to: RecipientId;
  help: number;
  back: number;
  deadline: number | null;
  sheet: SheetName | null;
  error: string | null;
  hidden: boolean;
}
export const initialSession: Session = {
  step: 'home', scenario: 'normal', consent: false, family: false, asked: false, pendingStart: false, balance: 2500,
  amount: '50', to: 'aina', help: 0, back: 0, deadline: null, sheet: null, error: null, hidden: false,
};

export type Action =
  | { type: 'scenario'; scenario: Scenario }
  | { type: 'transfer' } | { type: 'openConsent' } | { type: 'toggleFamily' } | { type: 'agree' } | { type: 'decline' } | { type: 'closeSheet' }
  | { type: 'pick'; to: RecipientId } | { type: 'next' }
  | { type: 'key'; key: string } | { type: 'setAmount'; amount: string }
  | { type: 'review'; now: number } | { type: 'confirm'; now: number }
  | { type: 'back' } | { type: 'help' } | { type: 'cancel' } | { type: 'done' } | { type: 'toggleHidden' };

export interface Derived {
  fixture: Fixture;
  active: boolean;
  signals: Signals;
  monitoring: boolean;
  decision: Decision;
  simple: boolean;
  paused: boolean;
  locked: boolean;
  remaining: number;
  fraction: number;
  alert: boolean;
}

export function derive(session: Session, now: number): Derived {
  const fixture = fixtures[session.scenario];
  const active = session.step === 'recipient' || session.step === 'amount' || session.step === 'review';
  const signals: Signals = {
    callActive: fixture.call, newRecipient: recipients[session.to].fresh, pasted: fixture.paste,
    amountRatio: Number(session.amount) / USUAL_AMOUNT || 0, backPresses: session.back + fixture.back, helpTaps: session.help,
  };
  const monitoring = session.consent && active;
  const idle: Decision = { classification: 'Normal', response: 'continue', reasons: [session.consent ? 'Monitoring starts at the recipient step' : 'Guardian is off for this wallet'] };
  const decision = monitoring ? evaluate(signals) : idle;
  const paused = session.deadline !== null || decision.response === 'hold' || decision.response === 'cooldown';
  const left = session.deadline === null ? 0 : Math.min(COOL_DOWN_MS, Math.max(0, session.deadline - now));
  return {
    fixture, active, signals, monitoring, decision, paused,
    simple: active && (decision.response === 'guide' || session.help > 0),
    locked: paused && (session.deadline === null || !canConfirm(session.deadline, now)),
    remaining: Math.ceil(left / 1000),
    fraction: left / COOL_DOWN_MS,
    alert: session.family && decision.response === 'hold',
  };
}

const home = (session: Session): Session => ({ ...session, step: 'home', deadline: null, error: null, sheet: null, pendingStart: false });

function start(session: Session): Session {
  const fixture = fixtures[session.scenario];
  return { ...session, step: 'recipient', amount: fixture.amount, to: fixture.to, help: 0, back: 0, deadline: null, error: null, sheet: null, pendingStart: false };
}

function typeKey(amount: string, key: string): string {
  if (key === 'del') return amount.slice(0, -1);
  if (key === '.') return amount.includes('.') ? amount : `${amount || '0'}.`;
  if (!/^\d$/.test(key) || /\.\d\d$/.test(amount) || amount.length >= 8) return amount;
  return amount === '0' ? key : amount + key;
}

export function reduce(session: Session, action: Action): Session {
  switch (action.type) {
    case 'scenario': return { ...home(session), scenario: action.scenario };
    case 'transfer': return session.asked ? start(session) : { ...session, sheet: 'consent', pendingStart: true };
    case 'openConsent': return { ...session, sheet: 'consent', pendingStart: false };
    case 'toggleFamily': return { ...session, family: !session.family };
    case 'agree': {
      const next: Session = { ...session, consent: true, asked: true, sheet: null };
      return session.pendingStart ? start(next) : next;
    }
    case 'decline': {
      const next: Session = { ...session, consent: false, family: false, asked: true, sheet: null };
      return session.pendingStart ? start(next) : next;
    }
    case 'closeSheet': return { ...session, sheet: null, pendingStart: false };
    case 'pick': return session.step === 'recipient' ? { ...session, to: action.to } : session;
    case 'next': return session.step === 'recipient' ? { ...session, step: 'amount' } : session;
    case 'key': return session.step === 'amount' ? { ...session, amount: typeKey(session.amount, action.key), error: null } : session;
    case 'setAmount': return session.step === 'amount' ? { ...session, amount: action.amount, error: null } : session;
    case 'review': {
      if (session.step !== 'amount') return session;
      const error = validateAmount(session.amount, session.balance);
      if (error) return { ...session, error };
      const next: Session = { ...session, error: null, step: 'review' };
      return derive(next, action.now).paused && session.deadline === null ? { ...next, deadline: action.now + COOL_DOWN_MS, sheet: 'pause' } : next;
    }
    case 'confirm': {
      if (session.step !== 'review' || derive(session, action.now).locked) return session;
      const error = validateAmount(session.amount, session.balance);
      if (error) return { ...session, error, step: 'amount' };
      return { ...session, balance: Math.round((session.balance - Number(session.amount)) * 100) / 100, step: 'success', deadline: null, sheet: null };
    }
    case 'back':
      if (session.step === 'review') return { ...session, step: 'amount', back: session.back + 1, error: null, sheet: null };
      if (session.step === 'amount') return { ...session, step: 'recipient', back: session.back + 1, error: null };
      return session.step === 'recipient' ? home(session) : session;
    case 'help': return { ...session, help: session.help + 1 };
    case 'cancel':
    case 'done': return home(session);
    case 'toggleHidden': return { ...session, hidden: !session.hidden };
  }
}

export function money(value: number | string): string {
  const [whole, cents] = (Number(value) || 0).toFixed(2).split('.');
  return `RM ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${cents}`;
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npm test`
Expected: PASS, 19 tests (6 existing, 13 new).

- [ ] **Step 5: Commit**

```bash
git add src/domain/session.ts src/domain/session.test.ts
git commit -m "feat: add wallet session reducer"
```

---

### Task 3: Tokens, viewport hook and session provider

**Files:**
- Modify: `src/global.css` (full replacement)
- Modify: `src/app/_layout.tsx` (full replacement)
- Create: `src/constants/layout.ts`, `src/hooks/use-viewport.ts`, `src/hooks/use-viewport.web.ts`, `src/components/wallet/session.tsx`, `src/components/wallet/palette.ts`

- [ ] **Step 1: Replace the stylesheet**

The `wide` and `xwide` breakpoints match the study (860px and 1180px). Web-only art classes live here because Tailwind utilities cannot express masks and pseudo-elements.

<!-- file: src/global.css -->
```css
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";
@import "nativewind/theme";
@source "../src";
@theme {
  --font-display: "HedvigLettersSerif", Georgia, serif;
  --font-body: "HedvigLettersSans", system-ui, sans-serif;
  --breakpoint-wide: 860px;
  --breakpoint-xwide: 1180px;
  /* page */
  --color-page: #f4f7fc;
  --color-ink: #0c1a33;
  --color-soft: #4d5b74;
  --color-line: #d3dcec;
  --color-accent: #1447e6;
  /* tokens the beUI sources expect */
  --color-primary: #1447e6;
  --color-primary-foreground: #ffffff;
  --color-background: #ffffff;
  --color-card: #ffffff;
  --color-border: #b8c4d9;
  --color-foreground: #0c1a33;
  --color-muted: #edf1f8;
  --color-muted-foreground: #4d5b74;
  --color-ring: #1447e6;
  /* wallet: its own product palette */
  --color-w-blue: #0a5bd3;
  --color-w-deep: #073f9c;
  --color-w-yellow: #ffd31f;
  --color-w-ink: #0e1b33;
  --color-w-muted: #5c6b85;
  --color-w-line: #e3e8f1;
  --color-w-surface: #f3f6fb;
  --color-w-tint: #e8f0fd;
  --color-w-amber: #8a4b00;
  --color-w-amber-bg: #fff4dc;
}
:root { color-scheme: light; --font-serif: "HedvigLettersSerif", Georgia, serif; --font-rounded: system-ui; --font-mono: monospace; }
html, body, #root { background: #f4f7fc; min-height: 100%; }
body { margin: 0; font-family: "HedvigLettersSans", system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
button, a, input { -webkit-tap-highlight-color: transparent; }

/* Flow art (web). The grid is a pseudo-element so it can fade with a mask. */
.flow-art { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.flow-art::before { content: ""; position: absolute; inset: 0; background-image: linear-gradient(rgba(20, 71, 230, .075) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 71, 230, .075) 1px, transparent 1px); background-size: 44px 44px; background-position: center top; mask-image: radial-gradient(ellipse 75% 85% at 68% 45%, #000 0%, transparent 78%); }
.flow-art canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; mask-image: linear-gradient(90deg, rgba(0, 0, 0, .28) 0%, rgba(0, 0, 0, .28) 30%, #000 62%); }

/* Canal-lock figure (web). The Hairline page is cropped to its plate: 16px side padding, 24px top padding. */
.lock-figure { position: relative; width: 100%; max-width: 640px; aspect-ratio: 5 / 4; overflow: hidden; border-radius: 24px; background: #fff; box-shadow: 0 0 0 1px #d3dcec; }
.lock-figure iframe { position: absolute; left: -16px; top: -24px; width: calc(100% + 32px); height: 620px; border: 0; }

/* Scroll reveal (web). The class is added after mount, so content is visible without JavaScript. */
.reveal { opacity: 0; transform: translateY(18px); transition: opacity .7s cubic-bezier(0.16, 1, 0.3, 1), transform .7s cubic-bezier(0.16, 1, 0.3, 1); }
.reveal.in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) { .reveal { opacity: 1; transform: none; transition: none; } }
```

- [ ] **Step 2: Add layout constants**

<!-- file: src/constants/layout.ts -->
```ts
export interface Viewport { width: number; height: number }

/** From this width up, the wallet runs inside the phone frame and stays interactive. */
export const WIDE = 860;
/** From this width up, the demo console overlaps the frame instead of sitting below the copy. */
export const XWIDE = 1180;

/** Outer size of the phone frame at scale 1. The screen inside is 440 x 956. */
export const FRAME = { width: 468, height: 984, statusBar: 58, homeIndicator: 26 } as const;
```

- [ ] **Step 3: Add the viewport hook pair**

Static web export renders without a window. The web hook returns `null` on the server and during hydration, so layout that depends on size never mismatches.

<!-- file: src/hooks/use-viewport.ts -->
```ts
import { useWindowDimensions } from 'react-native';
import type { Viewport } from '@/constants/layout';

export function useViewport(): Viewport | null {
  const { width, height } = useWindowDimensions();
  return { width, height };
}
```

<!-- file: src/hooks/use-viewport.web.ts -->
```ts
import { useSyncExternalStore } from 'react';
import type { Viewport } from '@/constants/layout';

function subscribe(callback: () => void) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}
const read = () => `${window.innerWidth}x${window.innerHeight}`;

/** Null until hydrated, so server and first client render agree. */
export function useViewport(): Viewport | null {
  const size = useSyncExternalStore(subscribe, read, () => null);
  if (!size) return null;
  const [width, height] = size.split('x').map(Number);
  return { width, height };
}
```

- [ ] **Step 4: Add the wallet palette**

<!-- file: src/components/wallet/palette.ts -->
```ts
// Mirrors the --color-w-* tokens in global.css, for props that take a colour value rather than a class.
export const W = {
  blue: '#0a5bd3', deep: '#073f9c', yellow: '#ffd31f', ink: '#0e1b33', muted: '#5c6b85', line: '#e3e8f1',
  surface: '#f3f6fb', tint: '#e8f0fd', amber: '#8a4b00', amberBg: '#fff4dc', green: '#12905a',
} as const;
```

- [ ] **Step 5: Add the session provider**

<!-- file: src/components/wallet/session.tsx -->
```tsx
import { createContext, use, useEffect, useReducer, useState, type Dispatch, type ReactNode } from 'react';
import { derive, initialSession, reduce, type Action, type Derived, type Session } from '@/domain/session';

interface SessionValue { session: Session; view: Derived; dispatch: Dispatch<Action> }
const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, dispatch] = useReducer(reduce, initialSession);
  const [now, setNow] = useState(() => Date.now());
  const { step, deadline } = session;
  // One timer for the whole app, running only while a pause is on screen.
  useEffect(() => {
    if (step !== 'review' || deadline === null) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [step, deadline]);
  return <SessionContext value={{ session, view: derive(session, now), dispatch }}>{children}</SessionContext>;
}

export function useSession(): SessionValue {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
```

- [ ] **Step 6: Replace the root layout**

The root `SafeAreaView` goes away so the wallet's blue header can run under the Android status bar. Each screen applies its own insets.

<!-- file: src/app/_layout.tsx -->
```tsx
import '@/global.css';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { HedvigLettersSerif_400Regular } from '@expo-google-fonts/hedvig-letters-serif';
import { HedvigLettersSans_400Regular } from '@expo-google-fonts/hedvig-letters-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '@/components/wallet/session';

SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const [loaded, error] = useFonts({ HedvigLettersSerif: HedvigLettersSerif_400Regular, HedvigLettersSans: HedvigLettersSans_400Regular });
  useEffect(() => { if (loaded || error) SplashScreen.hideAsync(); }, [loaded, error]);
  if (!loaded && !error) return null;
  return <SafeAreaProvider><SessionProvider>
    <StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F4F7FC' } }} />
  </SessionProvider></SafeAreaProvider>;
}
```

- [ ] **Step 7: Check**

Run: `npm run typecheck && npm run lint`
Expected: PASS. The old screens still compile; they are replaced in Tasks 7 and 10.

- [ ] **Step 8: Commit**

```bash
git add src/global.css src/app/_layout.tsx src/constants/layout.ts src/hooks/use-viewport.ts src/hooks/use-viewport.web.ts src/components/wallet/session.tsx src/components/wallet/palette.ts
git commit -m "feat: add Current tokens, viewport hook and session provider"
```

---

### Task 4: Wallet primitives

**Files:**
- Create: `src/components/wallet/button.tsx`, `sheet.tsx`, `toggle.types.ts`, `toggle.tsx`, `toggle.web.tsx`, `step-chrome.tsx`
- Create: `src/components/beui/switch.web.tsx` (vendored)
- Modify: `.gitattributes`, `docs/design-notes.md` (source note)

- [ ] **Step 1: Vendor the beUI Switch**

Run:
```bash
curl -sL -o src/components/beui/switch.web.tsx https://raw.githubusercontent.com/starc007/ui-components/9deb728d936b5f89c859ab6c1f169235aa24b3ad/components/motion/switch.tsx
head -5 src/components/beui/switch.web.tsx
```
Expected: the file starts with `"use client";` and imports `animate, motion, MotionConfig, useReducedMotion` from `motion/react`. It is 96 lines and exports `Switch` with props `checked`, `onCheckedChange`, `disabled`, `label`, `ariaLabel`, `className`. Do not edit it. `eslint.config.js` already ignores `src/components/beui/**`.

Append to `.gitattributes`:
```
src/components/beui/switch.web.tsx whitespace=-blank-at-eof
```

In `docs/design-notes.md`, under "Source and licensing", add this bullet after the first one:
```markdown
- The web switch is the official beUI source, unmodified, from commit `9deb728` of `starc007/ui-components` (`components/motion/switch.tsx`), kept in `src/components/beui/switch.web.tsx` under the same MIT notice.
```

- [ ] **Step 2: Write the toggle pair**

<!-- file: src/components/wallet/toggle.types.ts -->
```ts
export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Read by screen readers. The visible text sits beside the control. */
  label: string;
}
```

<!-- file: src/components/wallet/toggle.web.tsx -->
```tsx
import { Switch } from '@/components/beui/switch.web';
import type { ToggleProps } from './toggle.types';

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return <Switch checked={checked} onCheckedChange={onChange} ariaLabel={label} />;
}
```

<!-- file: src/components/wallet/toggle.tsx -->
```tsx
import { Switch } from 'react-native';
import { W } from './palette';
import type { ToggleProps } from './toggle.types';

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return <Switch value={checked} onValueChange={onChange} accessibilityLabel={label}
    trackColor={{ false: '#c3ccda', true: W.blue }} thumbColor="#ffffff" />;
}
```

- [ ] **Step 3: Write the wallet button**

<!-- file: src/components/wallet/button.tsx -->
```tsx
import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

interface WalletButtonProps {
  label: string;
  onPress: () => void;
  /** primary: filled blue. line: white with a border. quiet: text only. */
  variant?: 'primary' | 'line' | 'quiet';
  disabled?: boolean;
  /** Simple mode size. */
  large?: boolean;
  icon?: ReactNode;
}

const tone = { primary: 'bg-w-blue', line: 'border border-[#c9d2e0] bg-white', quiet: '' };
const ink = { primary: 'text-white', line: 'text-w-ink', quiet: 'text-w-deep' };

export function WalletButton({ label, onPress, variant = 'primary', disabled, large, icon }: WalletButtonProps) {
  const height = variant === 'quiet' ? (large ? 'h-[52px]' : 'h-[46px]') : large ? 'h-16' : 'h-[54px]';
  const size = variant === 'quiet' ? (large ? 'text-[17px]' : 'text-[15px]') : large ? 'text-xl' : 'text-[17px]';
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    className={`flex-row items-center justify-center gap-2 rounded-full px-3 active:scale-[0.975] active:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb300] ${height} ${tone[variant]} ${disabled ? 'opacity-45' : ''}`}>
    {icon}<Text className={`font-body ${size} ${ink[variant]}`}>{label}</Text>
  </Pressable>;
}
```

- [ ] **Step 4: Write the sheet**

It is absolutely positioned inside the wallet, so it opens inside the phone frame on desktop web and fills the screen on Android. Reanimated layout animations follow the system reduced-motion setting by default. Animated views are styled with `style`, not `className`, throughout this plan.

<!-- file: src/components/wallet/sheet.tsx -->
```tsx
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, SlideInDown } from 'react-native-reanimated';

interface SheetProps {
  label: string;
  bottom: number;
  /** Omit to make the scrim inert: the pause sheet must be answered with one of its buttons. */
  onDismiss?: () => void;
  children: ReactNode;
}

export function Sheet({ label, bottom, onDismiss, children }: SheetProps) {
  return <View className="absolute inset-0 z-10 justify-end">
    <Animated.View entering={FadeIn.duration(250)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8, 20, 43, 0.45)' }]}>
      {onDismiss && <Pressable className="flex-1" onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Close" />}
    </Animated.View>
    <Animated.View entering={SlideInDown.duration(450).easing(Easing.bezier(0.16, 1, 0.3, 1))} role="dialog" aria-modal aria-label={label}
      style={{ maxHeight: '86%', borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#ffffff', paddingHorizontal: 22, paddingTop: 12, paddingBottom: bottom + 14 }}>
      <View className="mb-3.5 h-[5px] w-10 self-center rounded-full bg-[#d5dbe6]" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3.5">{children}</ScrollView>
    </Animated.View>
  </View>;
}
```

- [ ] **Step 5: Write the step chrome**

<!-- file: src/components/wallet/step-chrome.tsx -->
```tsx
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { WalletButton } from './button';
import { CaretLeftIcon, LifebuoyIcon, LightbulbIcon } from './icons';
import { W } from './palette';
import { useSession } from './session';

export function StepHeader({ title, progress, top }: { title: string; progress: 1 | 2 | 3; top: number }) {
  const { dispatch } = useSession();
  return <View>
    <View className="flex-row items-center border-b border-w-line bg-white px-2.5 pb-2.5" style={{ paddingTop: top + 2 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => dispatch({ type: 'back' })}
        className="h-11 w-11 items-center justify-center rounded-full active:bg-w-surface focus-visible:outline-2 focus-visible:outline-[#ffb300]">
        <CaretLeftIcon size={22} color={W.ink} />
      </Pressable>
      <Text accessibilityRole="header" className="mr-11 flex-1 text-center font-body text-lg text-w-ink">{title}</Text>
    </View>
    <View aria-hidden className="flex-row gap-1.5 px-5 pt-3">
      {[1, 2, 3].map((index) => <View key={index} className={`h-1 flex-1 rounded-full ${index <= progress ? 'bg-w-blue' : 'bg-w-line'}`} />)}
    </View>
  </View>;
}

/** Small amber label for a demo signal or a new recipient. */
export function Tag({ label, icon }: { label: string; icon?: ReactNode }) {
  return <View className="flex-row items-center gap-1 self-start rounded-[10px] bg-w-amber-bg px-2 py-[3px]">
    {icon}<Text className="font-body text-[13px] text-w-amber">{label}</Text>
  </View>;
}

/** Simple mode: one instruction for the current step. */
export function Guide({ children }: { children: string }) {
  return <View className="flex-row gap-3 rounded-2xl bg-w-tint px-4 py-3.5">
    <LightbulbIcon size={24} color={W.deep} />
    <Text className="flex-1 font-body text-[17px] leading-6 text-w-deep">{children}</Text>
  </View>;
}

export function StepFooter({ label, onPress, disabled, bottom }: { label: string; onPress: () => void; disabled?: boolean; bottom: number }) {
  const { view, dispatch } = useSession();
  return <View className="gap-2 bg-w-surface px-5 pt-2.5" style={{ paddingBottom: bottom + 10 }}>
    <WalletButton label={label} onPress={onPress} disabled={disabled} large={view.simple} />
    <View className="flex-row justify-between">
      <WalletButton variant="quiet" large={view.simple} label="Help me with this step" icon={<LifebuoyIcon size={18} color={W.deep} />} onPress={() => dispatch({ type: 'help' })} />
      <WalletButton variant="quiet" large={view.simple} label="Cancel" onPress={() => dispatch({ type: 'cancel' })} />
    </View>
  </View>;
}
```

- [ ] **Step 6: Check**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/wallet src/components/beui/switch.web.tsx .gitattributes docs/design-notes.md
git commit -m "feat: add wallet button, sheet, toggle and step chrome"
```

---

### Task 5: Wallet views

Each view takes `top` and `bottom` insets in pixels. Inside the phone frame they are the frame's status row and home indicator; full screen they are the device safe areas.

**Files:**
- Create: `src/components/wallet/home.tsx`, `recipient.tsx`, `keypad.tsx`, `use-amount-keys.ts`, `use-amount-keys.web.ts`, `amount.tsx`, `pause-ring.tsx`, `review.tsx`, `success.tsx`, `sheets.tsx`, `wallet.tsx`

- [ ] **Step 1: Home**

The layout follows the familiar e-wallet pattern. It uses no third-party name or logo, and every tile that is not Transfer answers with "Not part of this demo".

<!-- file: src/components/wallet/home.tsx -->
```tsx
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { money } from '@/domain/session';
import {
  ArrowsLeftRightIcon, BellIcon, CarProfileIcon, ChartLineUpIcon, CreditCardIcon, DeviceMobileIcon, DotsNineIcon, EyeIcon, EyeSlashIcon,
  GiftIcon, HouseIcon, LetterCirclePIcon, PlusIcon, QrCodeIcon, ReceiptIcon, ScanIcon, ShieldCheckIcon, StorefrontIcon, UmbrellaIcon,
  UserIcon, WalletIcon, XIcon, type Icon,
} from './icons';
import { W } from './palette';
import { useSession } from './session';

const quick: [Icon, string][] = [[ScanIcon, 'Scan'], [QrCodeIcon, 'Pay'], [ArrowsLeftRightIcon, 'Transfer'], [CreditCardIcon, 'Cards']];
const services: [Icon, string][] = [
  [CarProfileIcon, 'Toll'], [LetterCirclePIcon, 'Parking'], [ReceiptIcon, 'Bills'], [DeviceMobileIcon, 'Prepaid'],
  [UmbrellaIcon, 'Insurance'], [ChartLineUpIcon, 'Invest'], [GiftIcon, 'Rewards'], [DotsNineIcon, 'More'],
];
const round = 'h-10 w-10 items-center justify-center rounded-full active:bg-white/15 focus-visible:outline-2 focus-visible:outline-[#ffb300]';
const tab = 'min-h-12 flex-1 items-center justify-center gap-[3px] rounded-xl';

interface HomeProps { top: number; bottom: number; onSoon: () => void; onExit?: () => void }

export function Home({ top, bottom, onSoon, onExit }: HomeProps) {
  const { session, view, dispatch } = useSession();
  return <View className="flex-1">
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="pb-4">
      <LinearGradient colors={['#2f7bea', W.blue, W.deep]} locations={[0, 0.4, 1]} start={{ x: 1, y: 0 }} end={{ x: 0.35, y: 1 }}
        style={{ paddingTop: top + 8, paddingHorizontal: 20, paddingBottom: 62 }}>
        <View className="flex-row items-center gap-3">
          <View aria-hidden className="h-[38px] w-[38px] items-center justify-center rounded-full bg-white"><Text className="font-body text-[17px] text-w-blue">R</Text></View>
          <View className="flex-1"><Text className="font-body text-[15px] text-white/90">Selamat datang</Text><Text className="font-body text-[17px] text-white">Rohani</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={onSoon} className={round}><BellIcon size={22} color="#ffffff" /></Pressable>
          {onExit && <Pressable accessibilityRole="button" accessibilityLabel="Close the wallet demo" onPress={onExit} className={round}><XIcon size={22} color="#ffffff" /></Pressable>}
        </View>
        <View className="mt-[22px] flex-row items-center gap-1.5">
          <Text className="font-body text-sm text-white/90">Demo balance</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={session.hidden ? 'Show balance' : 'Hide balance'} onPress={() => dispatch({ type: 'toggleHidden' })}
            className="h-8 w-8 items-center justify-center rounded-full active:bg-white/15 focus-visible:outline-2 focus-visible:outline-[#ffb300]">
            {session.hidden ? <EyeSlashIcon size={18} color="#ffffff" /> : <EyeIcon size={18} color="#ffffff" />}
          </Pressable>
        </View>
        <Text className="font-body text-[40px] leading-[46px] tracking-[-0.8px] text-white" style={{ fontVariant: ['tabular-nums'] }}>{session.hidden ? 'RM ••••' : money(session.balance)}</Text>
        <View className="mt-3.5 flex-row items-center justify-between">
          <Pressable accessibilityRole="button" onPress={onSoon} className="h-[38px] flex-row items-center gap-1.5 rounded-full bg-w-yellow px-4 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-white">
            <PlusIcon size={16} color="#1c2433" /><Text className="font-body text-[15px] text-[#1c2433]">Reload</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Guardian is ${session.consent ? 'on' : 'off'}. Change`} onPress={() => dispatch({ type: 'openConsent' })}
            className={`h-[38px] flex-row items-center gap-1.5 rounded-full px-4 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-[#ffb300] ${session.consent ? 'bg-white' : 'bg-white/15'}`}>
            <ShieldCheckIcon size={18} color={session.consent ? W.deep : '#ffffff'} weight={session.consent ? 'fill' : 'regular'} />
            <Text className={`font-body text-[15px] ${session.consent ? 'text-w-deep' : 'text-white'}`}>Guardian {session.consent ? 'on' : 'off'}</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View className="mx-4 -mt-11 flex-row rounded-[20px] bg-white px-1.5 py-3.5" style={{ boxShadow: '0 10px 28px -14px rgba(7, 63, 156, 0.35)' }}>
        {quick.map(([Glyph, label]) => <Pressable key={label} accessibilityRole="button" onPress={label === 'Transfer' ? () => dispatch({ type: 'transfer' }) : onSoon}
          className="flex-1 items-center gap-[7px] rounded-[14px] py-1.5 active:opacity-80 focus-visible:outline-2 focus-visible:outline-[#ffb300]">
          <View className="h-[50px] w-[50px] items-center justify-center rounded-2xl bg-w-blue"><Glyph size={26} color="#ffffff" /></View>
          <Text className="font-body text-[13px] text-w-ink">{label}</Text>
        </Pressable>)}
      </View>

      <View className="mx-4 mt-4 flex-row flex-wrap rounded-[20px] bg-white px-1.5 pb-2 pt-3.5">
        {services.map(([Glyph, label]) => <Pressable key={label} accessibilityRole="button" onPress={onSoon}
          className="w-1/4 items-center gap-[7px] rounded-[14px] py-2 active:opacity-80 focus-visible:outline-2 focus-visible:outline-[#ffb300]">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-w-tint"><Glyph size={23} color={W.blue} /></View>
          <Text className="font-body text-[13px] text-w-ink">{label}</Text>
        </Pressable>)}
      </View>

      <View className="m-4 flex-row gap-3 rounded-2xl bg-white px-4 py-3.5">
        <ShieldCheckIcon size={22} color={W.blue} />
        <View className="flex-1">
          <Text className="font-body text-[15px] text-w-ink">This is a demo wallet</Text>
          <Text className="font-body text-sm leading-5 text-w-muted">No real money moves. Scenario: {view.fixture.label.toLowerCase()}. Tap Transfer to begin.</Text>
        </View>
      </View>
    </ScrollView>

    <View className="flex-row items-end border-t border-w-line bg-white px-2 pt-2" style={{ paddingBottom: bottom + 2 }}>
      <View accessibilityRole="button" accessibilityState={{ selected: true }} className={tab}><HouseIcon size={24} color={W.blue} weight="fill" /><Text className="font-body text-xs text-w-blue">Home</Text></View>
      <Pressable accessibilityRole="button" onPress={onSoon} className={tab}><StorefrontIcon size={24} color={W.muted} /><Text className="font-body text-xs text-w-muted">Shop</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Scan" onPress={onSoon} className={tab}>
        <View className="-mt-[30px] h-[58px] w-[58px] items-center justify-center rounded-full border-4 border-white bg-w-blue"><ScanIcon size={28} color="#ffffff" /></View>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onSoon} className={tab}><WalletIcon size={24} color={W.muted} /><Text className="font-body text-xs text-w-muted">Finance</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={onSoon} className={tab}><UserIcon size={24} color={W.muted} /><Text className="font-body text-xs text-w-muted">Profile</Text></Pressable>
    </View>
  </View>;
}
```

- [ ] **Step 2: Recipient step**

<!-- file: src/components/wallet/recipient.tsx -->
```tsx
import { Pressable, ScrollView, Text, View } from 'react-native';
import { recipientIds, recipients } from '@/domain/session';
import { CheckCircleIcon, ClipboardTextIcon, UserPlusIcon } from './icons';
import { W } from './palette';
import { useSession } from './session';
import { Guide, StepFooter, StepHeader, Tag } from './step-chrome';

export function RecipientStep({ top, bottom }: { top: number; bottom: number }) {
  const { session, view, dispatch } = useSession();
  return <View className="flex-1">
    <StepHeader title="Transfer" progress={1} top={top} />
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="gap-3.5 px-5 pb-3 pt-[18px]">
      {view.simple && <Guide>Choose the person you want to send to. Then press Next.</Guide>}
      <Text accessibilityRole="header" className={`font-body text-w-ink ${view.simple ? 'text-[28px] leading-[34px]' : 'text-2xl'}`}>Who are you sending to?</Text>
      {!view.simple && <Text className="font-body text-[15px] text-w-muted">Pick a saved contact or a new recipient.</Text>}
      <View accessibilityRole="radiogroup" className="gap-3.5">
        {recipientIds.map((id) => {
          const person = recipients[id];
          const selected = session.to === id;
          return <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => dispatch({ type: 'pick', to: id })}
            className={`flex-row items-center gap-3.5 rounded-2xl border-2 bg-white active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-[#ffb300] ${view.simple ? 'p-4' : 'px-3.5 py-3'} ${selected ? 'border-w-blue' : 'border-transparent'}`}>
            <View aria-hidden className={`h-[46px] w-[46px] items-center justify-center rounded-full ${person.fresh ? 'bg-w-amber-bg' : 'bg-w-tint'}`}>
              {person.fresh ? <UserPlusIcon size={22} color={W.amber} /> : <Text className="font-body text-[19px] text-w-blue">{person.initial}</Text>}
            </View>
            <View className="flex-1 gap-0.5">
              <Text className={`font-body text-w-ink ${view.simple ? 'text-[21px]' : 'text-[17px]'}`}>{person.name}</Text>
              <Text className={`font-body text-w-muted ${view.simple ? 'text-base' : 'text-sm'}`}>{person.meta}</Text>
              {person.fresh && view.fixture.paste && <Tag label="Pasted, simulated" icon={<ClipboardTextIcon size={14} color={W.amber} />} />}
            </View>
            {selected && <CheckCircleIcon size={24} color={W.blue} weight="fill" />}
          </Pressable>;
        })}
      </View>
    </ScrollView>
    <StepFooter label="Next" onPress={() => dispatch({ type: 'next' })} bottom={bottom} />
  </View>;
}
```

- [ ] **Step 3: Keypad and hardware-keyboard hook**

<!-- file: src/components/wallet/keypad.tsx -->
```tsx
import { Pressable, Text, View } from 'react-native';
import { BackspaceIcon } from './icons';
import { W } from './palette';

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
const names: Record<string, string> = { del: 'Delete', '.': 'Decimal point' };

export function Keypad({ onKey, large }: { onKey: (key: string) => void; large: boolean }) {
  return <View className="flex-row flex-wrap px-4">
    {keys.map((key) => <View key={key} className="w-1/3 p-1">
      <Pressable accessibilityRole="button" accessibilityLabel={names[key] ?? key} onPress={() => onKey(key)}
        className={`items-center justify-center rounded-2xl bg-white active:scale-95 active:bg-w-tint focus-visible:outline-2 focus-visible:outline-[#ffb300] ${large ? 'h-[62px]' : 'h-14'}`}>
        {key === 'del' ? <BackspaceIcon size={24} color={W.ink} /> : <Text className={`font-body text-w-ink ${large ? 'text-[28px]' : 'text-2xl'}`}>{key}</Text>}
      </Pressable>
    </View>)}
  </View>;
}
```

<!-- file: src/components/wallet/use-amount-keys.ts -->
```ts
/** Android has no hardware-key entry for the amount. The on-screen keypad is the input. */
export function useAmountKeys(_onKey: ((key: string) => void) | null) {}
```

<!-- file: src/components/wallet/use-amount-keys.web.ts -->
```ts
import { useEffect } from 'react';
import { useIsFocused } from 'expo-router';

/** Lets a physical keyboard drive the keypad. Pass null to stay inert, as the tap-through preview does. */
export function useAmountKeys(onKey: ((key: string) => void) | null) {
  const focused = useIsFocused();
  useEffect(() => {
    if (!onKey || !focused) return;
    const listen = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Backspace') onKey('del');
      else if (/^[\d.]$/.test(event.key)) onKey(event.key);
    };
    document.addEventListener('keydown', listen);
    return () => document.removeEventListener('keydown', listen);
  }, [onKey, focused]);
}
```

- [ ] **Step 4: Amount step**

<!-- file: src/components/wallet/amount.tsx -->
```tsx
import { Pressable, ScrollView, Text, View } from 'react-native';
import { money, recipients } from '@/domain/session';
import { Keypad } from './keypad';
import { useSession } from './session';
import { Guide, StepFooter, StepHeader, Tag } from './step-chrome';
import { useAmountKeys } from './use-amount-keys';

export function AmountStep({ top, bottom, keys }: { top: number; bottom: number; keys: boolean }) {
  const { session, view, dispatch } = useSession();
  const onKey = (key: string) => dispatch({ type: 'key', key });
  useAmountKeys(keys ? onKey : null);
  const person = recipients[session.to];
  return <View className="flex-1">
    <StepHeader title="Transfer" progress={2} top={top} />
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="gap-3 pb-3 pt-[18px]">
      {view.simple && <View className="px-5"><Guide>Enter the amount in ringgit. Then press Review.</Guide></View>}
      <View className="items-center px-5 pt-2.5">
        <View className="flex-row items-center gap-2">
          <Text className="font-body text-[15px] text-w-muted">To {person.name}</Text>
          {person.fresh && <Tag label="New" />}
        </View>
        <View accessible accessibilityLabel={`Amount, ${money(session.amount)}`} aria-live="polite" className="flex-row items-baseline gap-1.5">
          <Text className="font-body text-2xl text-w-muted">RM</Text>
          <Text className="font-body text-[52px] leading-[60px] tracking-[-1.5px] text-w-ink" style={{ fontVariant: ['tabular-nums'] }}>{session.amount || '0'}</Text>
        </View>
        <Text className="font-body text-sm text-w-muted">Available {money(session.balance)}</Text>
      </View>
      <Text accessibilityRole="alert" className="min-h-[21px] px-5 text-center font-body text-[15px] text-[#a1260d]">{session.error ?? ''}</Text>
      {!view.simple && <View className="flex-row justify-center gap-2">
        {['10', '50', '100'].map((amount) => <Pressable key={amount} accessibilityRole="button" onPress={() => dispatch({ type: 'setAmount', amount })}
          className="h-10 justify-center rounded-full border border-w-line bg-white px-4 active:bg-w-tint focus-visible:outline-2 focus-visible:outline-[#ffb300]">
          <Text className="font-body text-[15px] text-w-ink">RM {amount}</Text>
        </Pressable>)}
      </View>}
      <Keypad onKey={onKey} large={view.simple} />
    </ScrollView>
    <StepFooter label="Review" onPress={() => dispatch({ type: 'review', now: Date.now() })} bottom={bottom} />
  </View>;
}
```

- [ ] **Step 5: Pause ring and review step**

<!-- file: src/components/wallet/pause-ring.tsx -->
```tsx
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { W } from './palette';

const RADIUS = 34;
const LENGTH = 2 * Math.PI * RADIUS;

/** fraction runs from 1 (pause just started) to 0 (pause over). */
export function PauseRing({ fraction, seconds }: { fraction: number; seconds: number }) {
  return <View aria-hidden className="h-[76px] w-[76px] items-center justify-center">
    <Svg width={76} height={76} viewBox="0 0 76 76" style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={38} cy={38} r={RADIUS} fill="none" stroke="rgba(138, 75, 0, 0.18)" strokeWidth={6} />
      <Circle cx={38} cy={38} r={RADIUS} fill="none" stroke={W.amber} strokeWidth={6} strokeLinecap="round" strokeDasharray={LENGTH} strokeDashoffset={LENGTH * (1 - fraction)} />
    </Svg>
    <Text className="font-body text-[26px] text-[#4f2b00]" style={{ fontVariant: ['tabular-nums'] }}>{seconds}</Text>
  </View>;
}
```

<!-- file: src/components/wallet/review.tsx -->
```tsx
import { ScrollView, Text, View } from 'react-native';
import { money, recipients } from '@/domain/session';
import { PauseRing } from './pause-ring';
import { useSession } from './session';
import { Guide, StepFooter, StepHeader } from './step-chrome';

export function ReviewStep({ top, bottom }: { top: number; bottom: number }) {
  const { session, view, dispatch } = useSession();
  const size = view.simple ? 'text-[19px]' : 'text-base';
  const rows: [string, string][] = [['To', recipients[session.to].name], ['Amount', money(session.amount)], ['Fee', 'RM 0.00'], ['From', 'Demo balance']];
  return <View className="flex-1">
    <StepHeader title="Review" progress={3} top={top} />
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="gap-3.5 px-5 pb-3 pt-[18px]">
      {view.simple && <Guide>Check the person and the amount. Confirm only when both are right.</Guide>}
      <Text accessibilityRole="header" className={`font-body text-w-ink ${view.simple ? 'text-[28px] leading-[34px]' : 'text-2xl'}`}>{view.paused ? 'Take a moment' : 'Check your transfer'}</Text>
      <View className="rounded-[18px] bg-white px-4 py-1">
        {rows.map(([label, value], index) => <View key={label} className={`flex-row items-center justify-between gap-4 py-[13px] ${index ? 'border-t border-w-line' : ''}`}>
          <Text className={`font-body text-w-muted ${size}`}>{label}</Text>
          <Text className={`font-body text-w-ink ${label === 'Amount' ? 'text-[22px]' : size}`}>{value}</Text>
        </View>)}
      </View>
      {view.paused && <View className="flex-row items-center gap-4 rounded-[20px] bg-w-amber-bg p-4">
        <PauseRing fraction={view.fraction} seconds={view.remaining} />
        <Text aria-live="polite" className="flex-1 font-body text-[17px] leading-[23px] text-[#4f2b00]">{view.locked ? 'A short pause before you decide.' : 'The pause has ended. The choice is yours.'}</Text>
      </View>}
    </ScrollView>
    <StepFooter label={view.paused ? 'Continue with transfer' : 'Confirm transfer'} disabled={view.locked} onPress={() => dispatch({ type: 'confirm', now: Date.now() })} bottom={bottom} />
  </View>;
}
```

- [ ] **Step 6: Success**

<!-- file: src/components/wallet/success.tsx -->
```tsx
import { Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { money, recipients } from '@/domain/session';
import { WalletButton } from './button';
import { CheckCircleIcon } from './icons';
import { W } from './palette';
import { useSession } from './session';

export function Success({ top, bottom }: { top: number; bottom: number }) {
  const { session, dispatch } = useSession();
  return <View className="flex-1 bg-w-surface">
    <View className="flex-1 items-center justify-center gap-3 px-7" style={{ paddingTop: top }}>
      <Animated.View entering={ZoomIn.duration(450)}><CheckCircleIcon size={84} color={W.green} weight="fill" /></Animated.View>
      <Text accessibilityRole="header" className="text-center font-body text-[26px] text-w-ink">Demo transfer complete</Text>
      <Text className="text-center font-body text-base leading-6 text-w-muted">{money(session.amount)} to {recipients[session.to].name}. Your mock balance is now {money(session.balance)}. No real funds were sent.</Text>
    </View>
    <View className="px-5 pt-2.5" style={{ paddingBottom: bottom + 10 }}><WalletButton label="Done" onPress={() => dispatch({ type: 'done' })} /></View>
  </View>;
}
```

- [ ] **Step 7: Sheet contents**

<!-- file: src/components/wallet/sheets.tsx -->
```tsx
import { Text, View } from 'react-native';
import { WalletButton } from './button';
import { ClipboardIcon, HandPalmIcon, MicrophoneSlashIcon, type Icon } from './icons';
import { W } from './palette';
import { useSession } from './session';
import { Sheet } from './sheet';
import { Toggle } from './toggle';

const promises: [Icon, string][] = [
  [MicrophoneSlashIcon, 'No call audio and no caller identity.'],
  [ClipboardIcon, 'No clipboard contents. Only whether something was pasted.'],
  [HandPalmIcon, 'It can pause a transfer. It never blocks your decision.'],
];
const title = 'font-body text-[26px] leading-[30px] text-w-ink';
const body = 'font-body text-base leading-[22px] text-w-muted';

/** Guardian consent, with the separate trusted-contact consent beneath it. */
export function ConsentSheet({ bottom }: { bottom: number }) {
  const { session, dispatch } = useSession();
  return <Sheet label="Guardian consent" bottom={bottom} onDismiss={() => dispatch({ type: 'closeSheet' })}>
    <Text accessibilityRole="header" className={title}>Turn on Guardian for transfers?</Text>
    <Text className={body}>It watches one transfer at a time, from choosing a recipient until you confirm or cancel.</Text>
    <View className="gap-2.5">
      {promises.map(([Glyph, text]) => <View key={text} className="flex-row gap-2.5">
        <Glyph size={20} color={W.blue} /><Text className="flex-1 font-body text-[15px] leading-5 text-w-ink">{text}</Text>
      </View>)}
    </View>
    <View className="flex-row items-center gap-3 rounded-2xl bg-w-surface px-3.5 py-3">
      <Toggle checked={session.family} onChange={() => dispatch({ type: 'toggleFamily' })} label="Let Aina be asked to call me if a transfer is paused" />
      <Text className="flex-1 font-body text-[15px] leading-5 text-w-ink">Let Aina be asked to call me if a transfer is paused. No amount or account details are shared.</Text>
    </View>
    <WalletButton label="Agree and turn on" onPress={() => dispatch({ type: 'agree' })} />
    <WalletButton variant="quiet" label={session.consent ? 'Turn Guardian off' : 'Not now'} onPress={() => dispatch({ type: 'decline' })} />
  </Sheet>;
}

/** Shown once when a coached transfer reaches review. It asks; it does not accuse. */
export function PauseSheet({ bottom }: { bottom: number }) {
  const { view, dispatch } = useSession();
  return <Sheet label="Take a moment" bottom={bottom}>
    <Text accessibilityRole="header" className={title}>Is someone on the phone telling you to do this?</Text>
    <Text className={body}>Take time to check with someone you trust. You can cancel now, or decide to continue after the pause.</Text>
    {view.alert && <View className="gap-1 rounded-2xl bg-w-tint px-4 py-3.5">
      <Text className="font-body text-[15px] leading-5 text-w-deep">Alert preview for Aina: “A transfer was paused. Please call your family member to check in.”</Text>
      <Text className="font-body text-[13px] text-w-deep">Preview only. Nothing was sent to another device.</Text>
    </View>}
    <WalletButton label="Cancel this transfer" onPress={() => dispatch({ type: 'cancel' })} />
    <WalletButton variant="line" label="I want to review it myself" onPress={() => dispatch({ type: 'closeSheet' })} />
  </Sheet>;
}
```

- [ ] **Step 8: Wallet container**

<!-- file: src/components/wallet/wallet.tsx -->
```tsx
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInRight } from 'react-native-reanimated';
import { AmountStep } from './amount';
import { Home } from './home';
import { RecipientStep } from './recipient';
import { ReviewStep } from './review';
import { useSession } from './session';
import { ConsentSheet, PauseSheet } from './sheets';
import { Success } from './success';

export interface WalletProps {
  /** Space reserved above and below: the frame's status row and home indicator, or the device safe areas. */
  top: number;
  bottom: number;
  /** Shows a close control on the home screen. Used when the wallet is a full-screen route. */
  onExit?: () => void;
  /** False for the tap-through preview, so it ignores the hardware keyboard. */
  interactive?: boolean;
}

export function Wallet({ top, bottom, onExit, interactive = true }: WalletProps) {
  const { session } = useSession();
  const [toast, setToast] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const soon = () => {
    setToast(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(false), 1800);
  };
  const { step } = session;
  // A push for forward steps; a plain fade for the two resting screens.
  const entering = step === 'home' || step === 'success' ? FadeIn.duration(250) : FadeInRight.duration(380).easing(Easing.bezier(0.16, 1, 0.3, 1));
  return <View className="flex-1 bg-w-surface">
    <Animated.View key={step} entering={entering} style={{ flex: 1 }}>
      {step === 'home' && <Home top={top} bottom={bottom} onSoon={soon} onExit={onExit} />}
      {step === 'recipient' && <RecipientStep top={top} bottom={bottom} />}
      {step === 'amount' && <AmountStep top={top} bottom={bottom} keys={interactive} />}
      {step === 'review' && <ReviewStep top={top} bottom={bottom} />}
      {step === 'success' && <Success top={top} bottom={bottom} />}
    </Animated.View>
    {session.sheet === 'consent' && <ConsentSheet bottom={bottom} />}
    {session.sheet === 'pause' && <PauseSheet bottom={bottom} />}
    {toast && <Animated.View entering={FadeIn.duration(200)} role="status"
      style={{ position: 'absolute', zIndex: 20, alignSelf: 'center', bottom: bottom + 96, borderRadius: 999, backgroundColor: 'rgba(14, 27, 51, 0.9)', paddingHorizontal: 16, paddingVertical: 10 }}>
      <Text className="font-body text-sm text-white">Not part of this demo</Text>
    </Animated.View>}
  </View>;
}
```

- [ ] **Step 9: Check**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/components/wallet
git commit -m "feat: add wallet views for home, transfer steps and sheets"
```

---

### Task 6: Phone frame

A generic Pro Max outline with a Dynamic Island. Built from React Native views so the same component is the interactive frame on desktop web and the preview on Android.

**Files:**
- Create: `src/components/guardian/phone-frame.tsx`

- [ ] **Step 1: Write the frame**

<!-- file: src/components/guardian/phone-frame.tsx -->
```tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BatteryFullIcon, CellSignalFullIcon, PhoneCallIcon, WifiHighIcon } from '@/components/wallet/icons';
import { FRAME } from '@/constants/layout';

interface PhoneFrameProps {
  /** 1 renders the frame at 468 x 984. The wrapper takes the scaled size, so layout around it stays correct. */
  scale: number;
  /** Colour of the status row: light over the blue wallet header, dark elsewhere. */
  chrome: 'light' | 'dark';
  /** Expands the island into a call indicator. The call is a demo signal and is labelled as simulated. */
  callActive: boolean;
  children: ReactNode;
}

const titanium = ['#f1efea', '#a9a59d', '#ecebe6', '#8d8982', '#dedbd4', '#9e9a92'] as const;
const label = { fontFamily: 'HedvigLettersSans', fontSize: 12.5, color: '#ffffff' } as const;
const key = { position: 'absolute', width: 5, borderRadius: 3, backgroundColor: '#a9a59d' } as const;

function CallTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return <Animated.View entering={FadeIn.delay(200).duration(250)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
    <PhoneCallIcon size={16} color="#39d98a" weight="fill" />
    <Text style={label}>Simulated call</Text>
    <Text style={[label, { color: '#39d98a', fontVariant: ['tabular-nums'] }]}>{clock}</Text>
  </Animated.View>;
}

function Island({ live }: { live: boolean }) {
  const width = useSharedValue(live ? 204 : 124);
  useEffect(() => {
    width.set(withTiming(live ? 204 : 124, { duration: 500, easing: Easing.bezier(0.16, 1, 0.3, 1) }));
  }, [live, width]);
  const animated = useAnimatedStyle(() => ({ width: width.get() }));
  return <Animated.View accessibilityLabel={live ? 'Simulated call in progress' : undefined}
    style={[{ position: 'absolute', top: 14, alignSelf: 'center', height: 36, borderRadius: 20, paddingHorizontal: 12, backgroundColor: '#050506' }, animated]}>
    {live && <CallTimer />}
  </Animated.View>;
}

export function PhoneFrame({ scale, chrome, callActive, children }: PhoneFrameProps) {
  const tint = chrome === 'light' ? '#ffffff' : '#0e1b33';
  return <View style={{ width: FRAME.width * scale, height: FRAME.height * scale }}>
    <View style={{ width: FRAME.width, height: FRAME.height, transform: [{ scale }], transformOrigin: 'top left' }}>
      <View aria-hidden style={[key, { left: -4, top: 168, height: 38 }]} />
      <View aria-hidden style={[key, { left: -4, top: 238, height: 70 }]} />
      <View aria-hidden style={[key, { left: -4, top: 324, height: 70 }]} />
      <View aria-hidden style={[key, { right: -4, top: 270, height: 112 }]} />
      <View style={{ flex: 1, borderRadius: 76, boxShadow: '0 60px 90px -40px rgba(14, 27, 51, 0.42), 0 24px 40px -24px rgba(14, 27, 51, 0.3)' }}>
        <LinearGradient colors={titanium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 76, padding: 5 }}>
          <View style={{ flex: 1, borderRadius: 71, padding: 9, backgroundColor: '#08090b' }}>
            <View style={{ flex: 1, borderRadius: 62, overflow: 'hidden', backgroundColor: '#ffffff' }}>
              {children}
              <View aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: FRAME.statusBar, paddingTop: 20, paddingLeft: 46, paddingRight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none' }}>
                <Text style={{ fontFamily: 'HedvigLettersSans', fontSize: 17, color: tint }}>9:41</Text>
                <View style={{ flexDirection: 'row', gap: 7 }}>
                  <CellSignalFullIcon size={19} color={tint} weight="fill" /><WifiHighIcon size={19} color={tint} weight="fill" /><BatteryFullIcon size={19} color={tint} weight="fill" />
                </View>
              </View>
              <Island live={callActive} />
              <View aria-hidden style={{ position: 'absolute', bottom: 9, alignSelf: 'center', width: 148, height: 5, borderRadius: 3, backgroundColor: 'rgba(14, 27, 51, 0.82)', pointerEvents: 'none' }} />
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  </View>;
}
```

- [ ] **Step 2: Check**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/guardian/phone-frame.tsx
git commit -m "feat: add shared phone frame with simulated-call island"
```

---

### Task 7: Flow art

Web animates a flow field on a 2D canvas. Android shows the same field drawn once as an SVG and dims it while a transfer is paused. That difference is the capability boundary recorded in the spec.

**Files:**
- Create: `src/components/guardian/flow-art.types.ts`, `flow-art.web.tsx`, `flow-art.tsx`
- Modify: `scripts/build-native-art.mjs` (full replacement)
- Create (generated): `assets/guardian/current.svg`

- [ ] **Step 1: Types**

<!-- file: src/components/guardian/flow-art.types.ts -->
```ts
export interface FlowArtProps {
  /** True while a transfer is held in its cool-down. The art slows (web) or dims (Android). */
  paused: boolean;
}
```

- [ ] **Step 2: Web canvas**

<!-- file: src/components/guardian/flow-art.web.tsx -->
```tsx
import { useEffect, useRef } from 'react';
import type { FlowArtProps } from './flow-art.types';

interface Particle { x: number; y: number; age: number; life: number }

// Decorative 2D canvas, isolated from shared screens and from every Android bundle.
// It sleeps offscreen and in hidden tabs, and draws one still frame under reduced motion.
export function FlowArt({ paused }: FlowArtProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const target = useRef(1);
  useEffect(() => { target.current = paused ? 0.08 : 1; }, [paused]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0, height = 0, frame = 0, visible = true, speed = 1, time = 0;
    let particles: Particle[] = [];
    let pointer: { x: number; y: number } | null = null;
    const angle = (x: number, y: number) => Math.sin(x * 0.0026 + time * 0.21) * 1.05 + Math.cos(y * 0.0052 - time * 0.16) * 1.1 + Math.sin((x - y) * 0.0017 + time * 0.1) * 0.55;
    const spawn = (particle: Particle, anywhere: boolean) => {
      particle.x = anywhere ? Math.random() * width : -10;
      particle.y = Math.random() * height;
      particle.life = 160 + Math.random() * 320;
      particle.age = 0;
      return particle;
    };
    const step = (still: boolean) => {
      if (!still) {
        context.globalCompositeOperation = 'destination-out';
        context.fillStyle = 'rgba(0,0,0,.028)';
        context.fillRect(0, 0, width, height);
        context.globalCompositeOperation = 'source-over';
      }
      context.lineWidth = 1.1;
      context.lineCap = 'round';
      for (const particle of particles) {
        const direction = angle(particle.x, particle.y);
        let vx = (0.85 + Math.cos(direction) * 0.75) * speed;
        let vy = Math.sin(direction) * 1.25 * speed;
        if (pointer) {
          const dx = particle.x - pointer.x, dy = particle.y - pointer.y, distance = dx * dx + dy * dy;
          if (distance < 22000) {
            const push = (1 - distance / 22000) * 1.6, length = Math.sqrt(distance + 1);
            vx += (dx / length) * push;
            vy += (dy / length) * push;
          }
        }
        const x = particle.x + vx * 1.25, y = particle.y + vy * 1.25;
        const fade = Math.min(1, particle.age / 30, (particle.life - particle.age) / 30);
        context.strokeStyle = `rgba(20,71,230,${(still ? 0.05 : 0.2) * fade})`;
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(x, y);
        context.stroke();
        particle.x = x;
        particle.y = y;
        particle.age += 1;
        if (particle.age > particle.life || x > width + 10 || y < -10 || y > height + 10) spawn(particle, still || Math.random() < 0.3);
      }
    };
    const tick = () => {
      if (!visible || document.hidden || reduce.matches) { frame = 0; return; }
      speed += (target.current - speed) * 0.04;
      time += 0.016 * speed;
      step(false);
      frame = requestAnimationFrame(tick);
    };
    const resume = () => { if (!frame && visible && !document.hidden && !reduce.matches) frame = requestAnimationFrame(tick); };
    const size = () => {
      const ratio = Math.min(window.devicePixelRatio, 1.5), box = canvas.getBoundingClientRect();
      width = box.width;
      height = box.height;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: Math.round(Math.min(760, (width * height) / 2000)) }, () => spawn({ x: 0, y: 0, age: 0, life: 0 }, true));
      if (reduce.matches) { for (let index = 0; index < 90; index++) step(true); } else resume();
    };
    const move = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
      pointer = inside ? { x: event.clientX - box.left, y: event.clientY - box.top } : null;
    };
    const resize = new ResizeObserver(size);
    resize.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); });
    observer.observe(canvas);
    document.addEventListener('visibilitychange', resume);
    reduce.addEventListener('change', size);
    window.addEventListener('pointermove', move);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', resume);
      reduce.removeEventListener('change', size);
      window.removeEventListener('pointermove', move);
    };
  }, []);
  return <div aria-hidden="true" className="flow-art"><canvas ref={canvasRef} /></div>;
}
```

- [ ] **Step 3: Replace the native art generator**

<!-- file: scripts/build-native-art.mjs -->
```js
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
```

- [ ] **Step 4: Generate the asset**

Run: `node scripts/build-native-art.mjs`
Expected: prints `Wrote assets/guardian/current.svg`. The file exists and is about 135 KB.

- [ ] **Step 5: Native art**

<!-- file: src/components/guardian/flow-art.tsx -->
```tsx
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import type { FlowArtProps } from './flow-art.types';

// Android shows the flow field drawn once (scripts/build-native-art.mjs). No render loop runs for decoration.
export function FlowArt({ paused }: FlowArtProps) {
  return <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', opacity: paused ? 0.45 : 1 }]}>
    <Image source={require('@/assets/guardian/current.svg')} style={{ flex: 1 }} contentFit="cover" accessible={false} />
  </View>;
}
```

- [ ] **Step 6: Check and commit**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

```bash
git add src/components/guardian/flow-art.types.ts src/components/guardian/flow-art.web.tsx src/components/guardian/flow-art.tsx scripts/build-native-art.mjs assets/guardian/current.svg
git commit -m "feat: add flow-field art for web and a static companion for Android"
```

---

### Task 8: Console, wordmark, buttons, reveal and lock figure

**Files:**
- Create: `src/components/guardian/demo-console.tsx`, `wordmark.tsx`, `reveal.tsx`, `reveal.web.tsx`, `lock-figure.tsx`, `lock-figure.web.tsx`
- Modify: `src/components/guardian/action.types.ts`, `action.web.tsx`, `action.tsx` (full replacements)
- Create: `public/hairline-locks.html` (copy), `assets/guardian/locks.png` (captured)

- [ ] **Step 1: Demo console**

<!-- file: src/components/guardian/demo-console.tsx -->
```tsx
import { Pressable, Text, View } from 'react-native';
import { useSession } from '@/components/wallet/session';
import { fixtures, scenarios } from '@/domain/session';

interface DemoConsoleProps {
  /** Drops the signal table where space is tight. The "simulated" labels always stay. */
  compact?: boolean;
  className?: string;
}

/** Scenario switch and Guardian read-out. Everything here is a demo signal, and says so. */
export function DemoConsole({ compact, className = '' }: DemoConsoleProps) {
  const { session, view, dispatch } = useSession();
  const { fixture, signals, decision, monitoring, active } = view;
  const tone = !monitoring || decision.classification === 'Normal' ? 'text-ink' : decision.classification === 'Coached' ? 'text-w-amber' : 'text-accent';
  const rows: [string, string][] = [
    ['Call', fixture.call ? 'Active (simulated)' : 'None'],
    ['Recipient', active ? (signals.newRecipient ? 'New' : 'Saved') : 'Not chosen'],
    ['Paste flag', fixture.paste ? 'Present (simulated)' : 'None'],
    ['Amount', active ? `${signals.amountRatio.toFixed(1)}x usual` : 'Not entered'],
    ['Back steps', String(signals.backPresses)],
    ['Help taps', String(signals.helpTaps)],
  ];
  return <View className={`rounded-3xl bg-white/90 p-4 ${className}`} style={{ boxShadow: '0 0 0 1px rgba(12, 26, 51, 0.08), 0 30px 50px -28px rgba(12, 26, 51, 0.35)' }}>
    <Text className="mb-2.5 font-body text-[13px] text-soft">Demo signal, simulated</Text>
    <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-1.5">
      {scenarios.map((name) => {
        const on = session.scenario === name;
        return <Pressable key={name} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => dispatch({ type: 'scenario', scenario: name })}
          className={`h-10 grow basis-[45%] items-center justify-center rounded-[14px] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${on ? 'bg-ink' : 'bg-muted'}`}>
          <Text className={`font-body text-sm ${on ? 'text-white' : 'text-ink'}`}>{fixtures[name].label}</Text>
        </Pressable>;
      })}
    </View>
    <View aria-live="polite" className="mt-3.5 border-t border-line pt-3.5">
      <Text className="font-body text-xs text-soft">Guardian read-out</Text>
      <Text className={`mb-1.5 mt-0.5 font-display text-[27px] leading-[31px] tracking-[-0.5px] ${tone}`}>{monitoring ? decision.classification : 'Monitoring inactive'}</Text>
      {decision.reasons.map((reason) => <Text key={reason} className="font-body text-[13.5px] leading-5 text-soft">{reason}</Text>)}
      {!compact && <View className="mt-2.5 flex-row flex-wrap gap-px overflow-hidden rounded-xl bg-line">
        {rows.map(([label, value]) => <View key={label} className="grow basis-[45%] bg-white px-2.5 py-1.5">
          <Text className="font-body text-[11px] text-soft">{label}</Text>
          <Text className="font-body text-[12.5px] text-ink">{value}</Text>
        </View>)}
      </View>}
      <Text className="mt-2 font-body text-xs text-soft">Demonstration rules, not model output.</Text>
    </View>
  </View>;
}
```

- [ ] **Step 2: Wordmark**

<!-- file: src/components/guardian/wordmark.tsx -->
```tsx
import { Pressable, Text } from 'react-native';
import { ShieldCheckIcon } from '@/components/wallet/icons';

export function Wordmark({ onPress }: { onPress: () => void }) {
  return <Pressable accessibilityRole="link" accessibilityLabel="Scam Guardian, home" onPress={onPress}
    className="flex-row items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
    <ShieldCheckIcon size={26} color="#1447e6" weight="fill" />
    <Text className="font-display text-[23px] tracking-[-0.2px] text-ink">Scam Guardian</Text>
  </Pressable>;
}
```

- [ ] **Step 3: Restyle the landing buttons**

Pill shape, cobalt, and a `small` size for the nav and the "Play it" buttons.

<!-- file: src/components/guardian/action.types.ts -->
```ts
export interface ActionProps {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  large?: boolean;
  /** Compact size that hugs its label, for the nav and inline actions. */
  small?: boolean;
}
```

<!-- file: src/components/guardian/action.web.tsx -->
```tsx
import { Button } from '@/components/beui/base.web';
import type { ActionProps } from './action.types';

export function Action({ label, onPress, secondary, disabled, large, small }: ActionProps) {
  const size = small ? 'h-[42px] px-[18px] text-[15px]' : large ? 'h-16 px-7 text-lg' : 'h-[52px] px-[26px] text-base';
  return <Button size="lg" variant={secondary ? 'outline' : 'primary'} onClick={onPress} disabled={disabled}
    className={`${size} whitespace-nowrap rounded-full font-body font-normal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent`}>{label}</Button>;
}
```

<!-- file: src/components/guardian/action.tsx -->
```tsx
import { Button, Host, Text } from '@expo/ui';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import type { ActionProps } from './action.types';

export function Action({ label, onPress, secondary, disabled, large, small }: ActionProps) {
  const height = small ? 44 : large ? 64 : 52;
  return (
    <Host matchContents={small ? true : { vertical: true }} colorScheme="light" seedColor="#1447E6" style={small ? { minHeight: height } : { width: '100%', minHeight: height }}>
      <Button label={label} onPress={onPress} disabled={disabled}
        modifiers={small ? [] : [fillMaxWidth()]} variant={secondary ? 'outlined' : 'filled'} style={{ height, paddingHorizontal: small ? 16 : 20 }}>
        <Text textStyle={{ fontSize: large ? 20 : small ? 15 : 16 }}>{label}</Text>
      </Button>
    </Host>
  );
}
```

- [ ] **Step 4: Reveal pair**

<!-- file: src/components/guardian/reveal.tsx -->
```tsx
import type { ReactNode } from 'react';
import { View } from 'react-native';

/** Scroll reveal is a web nicety. On Android content is simply there. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={className}>{children}</View>;
}
```

<!-- file: src/components/guardian/reveal.web.tsx -->
```tsx
import { useEffect, useRef, type ReactNode } from 'react';

/** Fades content up as it enters the viewport. Content already on screen, or without JavaScript, stays visible. */
export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || element.getBoundingClientRect().top < window.innerHeight) return;
    element.classList.add('reveal');
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.classList.add('in');
      observer.disconnect();
    }, { threshold: 0.15 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`flex flex-col ${className}`}>{children}</div>;
}
```

- [ ] **Step 5: Lock figure assets**

Run:
```bash
mkdir -p public
cp design/hairline-locks.html public/hairline-locks.html
npx --yes playwright@1 screenshot --channel chrome --viewport-size=672,548 "file://$(pwd)/design/hairline-locks.html?theme=light" assets/guardian/locks.png
```
Expected: `public/hairline-locks.html` is 40,110 bytes. `assets/guardian/locks.png` is a 672 x 548 image of the three canal locks at rest on a white ground, with the page controls cropped off. If the Playwright command is unavailable, capture the same view by any means: the page at 672 px wide in the light theme, top 548 px.

- [ ] **Step 6: Lock figure pair**

<!-- file: src/components/guardian/lock-figure.web.tsx -->
```tsx
/** Appended to the caption only where the figure answers a pointer. */
export const LOCK_HINT = ' Move your pointer across the gates.';

// The Hairline page is served unchanged from public/. The .lock-figure rule in global.css crops it to its plate.
export function LockFigure() {
  return <div className="lock-figure">
    <iframe src="/hairline-locks.html?theme=light" title="Interactive line drawing of three canal locks" loading="lazy" />
  </div>;
}
```

<!-- file: src/components/guardian/lock-figure.tsx -->
```tsx
import { Image } from 'expo-image';
import { View } from 'react-native';

/** The Android figure is a still, so there is nothing to point at. */
export const LOCK_HINT = '';

// The Hairline engine is DOM-based. Android shows its rest pose, captured from design/hairline-locks.html.
export function LockFigure() {
  return <View className="overflow-hidden rounded-3xl border border-line bg-white">
    <Image source={require('@/assets/guardian/locks.png')} style={{ width: '100%', aspectRatio: 672 / 548 }} contentFit="contain"
      accessibilityLabel="Line drawing of three canal locks with one gate partly open" />
  </View>;
}
```

- [ ] **Step 7: Check and commit**

Run: `npm run typecheck && npm run lint`
Expected: PASS. The old screens still pass `Action` without `small`, which is optional.

```bash
git add src/components/guardian public/hairline-locks.html assets/guardian/locks.png
git commit -m "feat: add demo console, wordmark, reveal and lock figure"
```

---

### Task 9: Wallet screen (`/demo`)

**Files:**
- Modify: `src/screens/wallet.tsx` (full replacement)

- [ ] **Step 1: Replace the screen**

<!-- file: src/screens/wallet.tsx -->
```tsx
import { useEffect } from 'react';
import { BackHandler, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Action } from '@/components/guardian/action';
import { DemoConsole } from '@/components/guardian/demo-console';
import { FlowArt } from '@/components/guardian/flow-art';
import { PhoneFrame } from '@/components/guardian/phone-frame';
import { Wordmark } from '@/components/guardian/wordmark';
import { useSession } from '@/components/wallet/session';
import { Wallet } from '@/components/wallet/wallet';
import { FRAME, WIDE } from '@/constants/layout';
import { useViewport } from '@/hooks/use-viewport';

export default function WalletScreen() {
  const viewport = useViewport();
  const insets = useSafeAreaInsets();
  const { session, view, dispatch } = useSession();
  const { step, sheet } = session;

  // Android back walks the transfer backwards before it leaves the screen.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheet) { dispatch({ type: 'closeSheet' }); return true; }
      if (step === 'home') return false;
      dispatch(step === 'success' ? { type: 'done' } : { type: 'back' });
      return true;
    });
    return () => subscription.remove();
  }, [step, sheet, dispatch]);

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  if (!viewport) return <View className="flex-1 bg-page" />;

  // Narrow web and Android: the device is the phone, so there is no frame.
  if (viewport.width < WIDE) return <View className="flex-1 bg-w-surface">
    <StatusBar style={step === 'home' ? 'light' : 'dark'} />
    <Wallet top={Math.max(insets.top, 12)} bottom={Math.max(insets.bottom, 10)} onExit={leave} />
  </View>;

  const scale = Math.min(viewport.height * 0.84, 840) / FRAME.height;
  return <View className="flex-1 bg-page">
    <FlowArt paused={step === 'review' && view.locked} />
    <View className="mx-auto w-full max-w-[1320px] flex-1 px-10">
      <View className="h-[72px] flex-row items-center justify-between">
        <Wordmark onPress={() => router.replace('/')} />
        <View><Action small secondary label="Product page" onPress={leave} /></View>
      </View>
      <View className="flex-1 flex-row items-center justify-center gap-10 pb-8">
        <DemoConsole className="w-[300px]" />
        <PhoneFrame scale={scale} chrome={step === 'home' ? 'light' : 'dark'} callActive={view.fixture.call}>
          <Wallet top={FRAME.statusBar} bottom={FRAME.homeIndicator} />
        </PhoneFrame>
      </View>
    </View>
  </View>;
}
```

- [ ] **Step 2: Check**

Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS, 19 tests.

- [ ] **Step 3: Look at it**

Run: `npx expo start --web`, open `/demo`.
- At 1440 wide: flow art, console on the left, framed wallet on the right.
- At 412 wide: wallet full screen, no frame, close control top right.
- Select "Coached, high", tap Transfer, agree, Next, Review. The pause sheet rises, the ring counts down from 30, and Continue stays disabled until it reaches 0.

Fix anything broken before committing. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/screens/wallet.tsx
git commit -m "feat: rebuild the wallet screen on the shared session and frame"
```

---

### Task 10: Landing screen

**Files:**
- Modify: `src/screens/landing.tsx` (full replacement)

- [ ] **Step 1: Replace the screen**

<!-- file: src/screens/landing.tsx -->
```tsx
import { useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Action } from '@/components/guardian/action';
import { DemoConsole } from '@/components/guardian/demo-console';
import { FlowArt } from '@/components/guardian/flow-art';
import { LOCK_HINT, LockFigure } from '@/components/guardian/lock-figure';
import { PhoneFrame } from '@/components/guardian/phone-frame';
import { Reveal } from '@/components/guardian/reveal';
import { Wordmark } from '@/components/guardian/wordmark';
import { AppWindowIcon, ClipboardIcon, MicrophoneSlashIcon, PhoneSlashIcon, type Icon } from '@/components/wallet/icons';
import { useSession } from '@/components/wallet/session';
import { Wallet } from '@/components/wallet/wallet';
import { FRAME, WIDE, XWIDE } from '@/constants/layout';
import type { Scenario } from '@/domain/risk';
import { useViewport } from '@/hooks/use-viewport';

const cases: { scenario: Scenario; state: string; title: string; detail: string }[] = [
  { scenario: 'normal', state: 'Normal', title: 'Carry on', detail: 'A usual amount to a saved contact goes through with no interruption.' },
  { scenario: 'struggling', state: 'Struggling', title: 'A clearer path', detail: 'Repeated back steps or help taps switch the wallet to Simple mode: bigger controls, one instruction at a time. No accusation.' },
  { scenario: 'coached', state: 'Coached', title: 'Take a moment', detail: 'A call in progress plus a new recipient triggers a short pause. When it ends, the choice is still yours.' },
];
const never: [Icon, string][] = [[MicrophoneSlashIcon, 'Call audio'], [PhoneSlashIcon, 'Caller identity'], [ClipboardIcon, 'Clipboard contents'], [AppWindowIcon, 'Activity in other apps']];

const section = 'mx-auto w-full max-w-[1320px] px-5 wide:px-10';
const h2 = 'max-w-[620px] font-display text-[34px] leading-[38px] tracking-[-1px] text-ink wide:text-[54px] wide:leading-[58px] wide:tracking-[-1.6px]';
const intro = 'mt-5 max-w-[560px] font-body text-lg leading-[29px] text-soft';
const h3 = 'font-display text-[28px] leading-8 tracking-[-0.5px]';
const cell = 'rounded-3xl p-[26px] wide:p-[34px]';
const link = 'rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent';

export default function Landing() {
  const viewport = useViewport();
  const insets = useSafeAreaInsets();
  const { session, view, dispatch } = useSession();
  const scroll = useRef<ScrollView>(null);
  const anchors = useRef({ how: 0, privacy: 0 });
  const wide = !!viewport && viewport.width >= WIDE;
  const overlap = !!viewport && viewport.width >= XWIDE;

  const openDemo = () => router.push('/demo');
  const jump = (y: number) => scroll.current?.scrollTo({ y, animated: true });
  // On desktop the wallet is already on the page, so a scenario plays in place. Elsewhere it opens the wallet.
  const play = (scenario: Scenario) => {
    dispatch({ type: 'scenario', scenario });
    if (wide) jump(0); else openDemo();
  };

  const scale = !viewport ? 0 : wide ? Math.min(viewport.height * 0.84, 840) / FRAME.height : Math.min(340, viewport.width - 56) / FRAME.width;
  const phone = <PhoneFrame scale={scale} chrome={session.step === 'home' ? 'light' : 'dark'} callActive={view.fixture.call}>
    <Wallet top={FRAME.statusBar} bottom={FRAME.homeIndicator} interactive={wide} />
  </PhoneFrame>;

  return <ScrollView ref={scroll} className="flex-1 bg-page" contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
    <View className="overflow-hidden">
      <FlowArt paused={session.step === 'review' && view.locked} />
      <View className={section}>
        <View className="h-16 flex-row items-center gap-9 wide:h-[72px]">
          <View className="mr-auto"><Wordmark onPress={() => jump(0)} /></View>
          {wide && <Pressable accessibilityRole="link" onPress={() => jump(anchors.current.how)} className={link}><Text className="font-body text-[15px] text-soft">How it works</Text></Pressable>}
          {wide && <Pressable accessibilityRole="link" onPress={() => jump(anchors.current.privacy)} className={link}><Text className="font-body text-[15px] text-soft">Privacy</Text></Pressable>}
          <View><Action small label="Try the wallet" onPress={openDemo} /></View>
        </View>

        <View className="pb-12 pt-7 wide:flex-row wide:items-center wide:gap-16 wide:pt-0" style={wide && viewport ? { minHeight: viewport.height - 72 } : undefined}>
          <View className="wide:flex-1 wide:pb-10">
            <Text accessibilityRole="header" className="max-w-[640px] font-display text-[44px] leading-[46px] tracking-[-1.5px] text-ink wide:text-[62px] wide:leading-[64px] wide:tracking-[-2.2px] xwide:text-[78px] xwide:leading-[80px] xwide:tracking-[-2.7px]">A pause before the money moves.</Text>
            <Text className="mt-6 max-w-[420px] font-body text-[17px] leading-[27px] text-soft wide:text-[19px] wide:leading-[30px]">Scam Guardian helps when a transfer gets confusing, and makes room to think when someone else may be directing it.</Text>
            <View className="mt-8 flex-row flex-wrap gap-3">
              <View className="min-w-[150px] flex-1 wide:max-w-[200px]"><Action label="Try the wallet" onPress={openDemo} /></View>
              <View className="min-w-[150px] flex-1 wide:max-w-[200px]"><Action secondary label="How it works" onPress={() => jump(anchors.current.how)} /></View>
            </View>
            {!overlap && <DemoConsole compact={!wide} className="mt-8 wide:max-w-[320px]" />}
          </View>

          {viewport && wide && <View style={{ paddingLeft: overlap ? 236 : 0 }}>
            {overlap && <DemoConsole className="absolute bottom-[7%] left-0 z-10 w-[264px]" />}
            {phone}
          </View>}
          {viewport && !wide && <Pressable accessibilityRole="button" accessibilityLabel="Open the wallet demo full screen" onPress={openDemo}
            className="-mx-5 mt-9 h-[430px] items-center overflow-hidden pt-4">
            <View style={{ pointerEvents: 'none' }}>{phone}</View>
          </Pressable>}
        </View>
      </View>
    </View>

    <View onLayout={(event) => { anchors.current.how = event.nativeEvent.layout.y; }} className={`${section} py-[72px] wide:py-[120px]`}>
      <Reveal>
        <Text accessibilityRole="header" className={h2}>Three situations. Three different responses.</Text>
        <Text className={intro}>Hesitation alone does not mean fraud. Guardian reads the context of one transfer and answers with help, or with time.</Text>
      </Reveal>
      <View className="mt-10 wide:mt-14">
        {cases.map((item, index) => <Reveal key={item.scenario}>
          <View className={`gap-2.5 py-7 wide:flex-row wide:items-center wide:gap-8 ${index ? 'border-t border-line' : ''}`}>
            <Text className="font-body text-[15px] text-accent wide:w-[150px]">{item.state}</Text>
            <Text accessibilityRole="header" className="font-display text-[28px] leading-8 tracking-[-0.6px] text-ink wide:flex-1 wide:text-[36px] wide:leading-10">{item.title}</Text>
            <Text className="font-body text-base leading-[26px] text-soft wide:flex-[1.25]">{item.detail}</Text>
            <View className="mt-2 self-start wide:mt-0"><Action small secondary label="Play it" onPress={() => play(item.scenario)} /></View>
          </View>
        </Reveal>)}
      </View>
    </View>

    <View onLayout={(event) => { anchors.current.privacy = event.nativeEvent.layout.y; }} className={`${section} pb-[72px] wide:pb-[120px]`}>
      <Reveal><Text accessibilityRole="header" className={h2}>Your decision. Your privacy.</Text></Reveal>
      <View className="mt-10 gap-4 wide:mt-14 wide:flex-row">
        <Reveal className="wide:flex-[1.25]">
          <View className={`flex-1 bg-[#e9eefa] ${cell}`}>
            <Text accessibilityRole="header" className={`${h3} text-ink`}>What Guardian never collects</Text>
            <Text className="mt-3 font-body text-base leading-[26px] text-soft">The design works from a summary of the transfer session, kept on the device.</Text>
            <View className="mt-10 flex-row flex-wrap gap-3 wide:mt-auto wide:pt-12">
              {never.map(([Glyph, label]) => <View key={label} className="grow basis-[45%] gap-5 rounded-[14px] bg-white p-4">
                <Glyph size={28} color="#1447e6" /><Text className="font-body text-base text-ink">{label}</Text>
              </View>)}
            </View>
          </View>
        </Reveal>
        <View className="gap-4 wide:flex-1">
          <Reveal>
            <View className={`bg-white ${cell}`}>
              <Text accessibilityRole="header" className={`${h3} text-ink`}>One transfer at a time</Text>
              <Text className="mt-3 font-body text-base leading-[26px] text-soft">Monitoring starts when you choose a recipient and ends when you confirm or cancel. Browsing your balance is outside it.</Text>
            </View>
          </Reveal>
          <Reveal>
            <View className={`bg-accent ${cell}`}>
              <Text accessibilityRole="header" className={`${h3} text-white`}>A trusted contact, on your terms</Text>
              <View className="mt-5 max-w-[340px] self-start rounded-[14px] bg-white px-4 py-3.5"><Text className="font-body text-[15px] leading-[22px] text-ink">A transfer was paused. Please call your family member to check in.</Text></View>
              <Text className="mt-3 font-body text-base leading-[26px] text-white">No amount. No account details. You choose the person, with separate consent.</Text>
            </View>
          </Reveal>
        </View>
      </View>
    </View>

    <View className={`${section} gap-8 pb-[72px] wide:flex-row wide:items-center wide:gap-14 wide:pb-[120px]`}>
      <Reveal className="wide:flex-1">
        <Text accessibilityRole="header" className={h2}>The pause, drawn as a canal lock.</Text>
        <Text className={intro}>A lock does not stop a boat. It holds it for a moment, then lets it through.{LOCK_HINT}</Text>
      </Reveal>
      <View className="w-full wide:w-[640px]"><LockFigure /></View>
    </View>

    <View className="border-t border-line">
      <View className={`${section} py-12`}>
        <Text className="max-w-[620px] font-body text-[14.5px] leading-6 text-soft">Prototype for Dormathon 2026. Mock money, simulated call and paste signals, demonstration rules in place of a trained model, and a family alert that stays on this screen as a preview. Not connected to a bank.</Text>
      </View>
    </View>
  </ScrollView>;
}
```

- [ ] **Step 2: Check**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 3: Look at it**

Run: `npx expo start --web`, open `/`.
- 1440 wide: matches `design/v2/current.html`. Copy left, framed wallet right, console overlapping the frame's lower left. The wallet works in place.
- 1024 wide: console moves under the buttons, frame stays on the right.
- 412 wide: copy, buttons, compact console, cropped frame. Tapping the frame opens `/demo`.
- "Play it" on Coached: on desktop the page scrolls to the top with the scenario selected; on narrow it opens `/demo`.

Fix anything that does not match the study before committing. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/screens/landing.tsx
git commit -m "feat: rebuild the landing page as direction A, Current"
```

---

### Task 11: Remove what the redesign replaced

**Files:** deletions, `package.json`, `README.md`

- [ ] **Step 1: Confirm nothing still imports the files to be deleted**

Run:
```bash
grep -rnE "constants/(designs|theme)|hero-art|guardian/field|animated-icon|external-link|hint-row|themed-(text|view)|web-badge|ui/collapsible|use-color-scheme|use-theme|from 'three'" src
```
Expected: matches only inside the files listed in Step 2 (they import each other). No match in `src/app`, `src/screens`, `src/components/wallet`, or the new `src/components/guardian` files. If there is one, stop and fix the importer first.

- [ ] **Step 2: Delete**

```bash
git rm -q src/constants/designs.ts src/constants/theme.ts \
  src/components/guardian/hero-art.tsx src/components/guardian/hero-art.web.tsx \
  src/components/guardian/field.tsx src/components/guardian/field.web.tsx src/components/guardian/field.types.ts \
  src/components/animated-icon.tsx src/components/animated-icon.web.tsx src/components/animated-icon.module.css \
  src/components/external-link.tsx src/components/hint-row.tsx src/components/themed-text.tsx src/components/themed-view.tsx \
  src/components/web-badge.tsx src/components/ui/collapsible.tsx \
  src/hooks/use-color-scheme.ts src/hooks/use-color-scheme.web.ts src/hooks/use-theme.ts \
  assets/guardian/fluid.svg assets/guardian/grid.svg assets/guardian/ledger.svg \
  assets/images/expo-logo.png assets/images/logo-glow.png assets/images/expo-badge.png assets/images/expo-badge-white.png \
  assets/images/react-logo.png "assets/images/react-logo@2x.png" "assets/images/react-logo@3x.png" assets/images/tutorial-web.png \
  design/fluid.html design/grid.html design/ledger.html design/index.html scripts/build-design-samples.mjs
git rm -q -r assets/images/tabIcons
```

- [ ] **Step 3: Remove Three.js and the samples script**

Run: `npm uninstall three @types/three`

Then delete this line from the `scripts` block of `package.json`, and the trailing comma on the line before it:
```json
    "samples": "node scripts/build-design-samples.mjs"
```

- [ ] **Step 4: Update the README**

Replace the "Design samples" section (from the `## Design samples` heading up to, not including, the next `##` heading) with:

```markdown
## Design

The app follows direction A, "Current". The approved study is `design/v2/current.html`; `design/v2/index.html` shows it beside the two directions that were not chosen. Serve the folder with `node scripts/preview.mjs design 4321` and open `http://127.0.0.1:4321/v2/`.

The Hairline canal-lock figure is `design/hairline-locks.html?theme=light&play=1`. Rebuild it with the Hairline skill's unchanged engine after editing `design/locks.js`, then copy it to `public/hairline-locks.html`.

The static Android art is generated: `node scripts/build-native-art.mjs` writes `assets/guardian/current.svg`.
```

- [ ] **Step 5: Check**

Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS, 19 tests.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove the design switcher, Three.js hero and starter leftovers"
```

---

### Task 12: Bring the docs in line

**Files:**
- Modify: `docs/design-notes.md`, `docs/implementation-plan.md`

- [ ] **Step 1: design-notes.md**

Replace everything from the top of the file down to, not including, `## Source and licensing` with:

```markdown
# Design

Reading this as a light, technical product page for hackathon judges, paired with an accessible transfer flow for older Malaysians.

The app follows direction A, "Current", chosen by the user on 9 October 2026 from three v2 studies (`design/v2/`). The earlier Fluid Guardian, Signal Grid and Human Ledger studies were retired.

Taste dials for the landing page: design variance 7, motion intensity 6, visual density 4. The wallet is product UI and is out of the Taste skill's scope; it follows native, accessible form patterns.

The user's explicit light theme, Expo, Tailwind and grid/particle requirements override conflicting skill defaults. Hedvig Letters Serif was named in the brief, which is the Taste skill's condition for a serif display face. The hero's visual is the working wallet itself, not a mock screenshot.

## Current

- Palette: page `#f4f7fc`, ink `#0c1a33`, one accent, cobalt `#1447e6`. The wallet has its own product palette (blue, deep blue, yellow, amber for pause states).
- Type: Hedvig Letters Serif for display, Hedvig Letters Sans for everything else.
- Shape: pill buttons, 14px controls, 24px surfaces.
- Art: a flow field of particles over a faint 44px grid. It slows while a transfer is paused, so the page tells the same story as the wallet. Android shows the field drawn once and dims it during a pause.
- Wallet: the familiar e-wallet arrangement (balance header, Reload, Scan / Pay / Transfer / Cards, service grid, centre scan tab), with no third-party name or logo.
- Frame: a generic Pro Max outline with a Dynamic Island. No verified iPhone 18 Pro Max reference was available. The island shows the simulated call, labelled as simulated.

```

In the same file, replace the bullet beginning `- Three.js appears only in a decorative` with:

```markdown
- The page art is a 2D canvas in a `.web.tsx` island. It limits DPR, sleeps offscreen and in hidden tabs, honours reduced motion with one still frame, and cleans up its observers. Android uses a bundled static SVG of the same field; `scripts/build-native-art.mjs` reproduces it without network access or a render loop. Three.js was removed.
- Icons are Phosphor (MIT), through `phosphor-react-native`, imported only in `src/components/wallet/icons.ts`.
```

Replace the whole `## Sample scope` section with:

```markdown
## Studies

`design/v2/` holds the three self-contained v2 studies and their chooser. They share one vanilla-JS wallet whose rules mirror `src/domain/risk.ts`, with a 10-second pause for quick comparison. The app uses 30 seconds. The Signal study's Mango Grotesque files are not tracked.
```

- [ ] **Step 2: implementation-plan.md**

Replace the bullet `- The user selected Fluid Guardian after reviewing samples. Signal Grid and Human Ledger remain comparison studies.` with:

```markdown
- The user selected direction A, "Current", from the v2 studies on 9 October 2026. Spec: `docs/superpowers/specs/2026-10-09-current-redesign-design.md`.
```

Replace the first paragraph under `## Current slice` with:

```markdown
Product page with a live wallet in a phone frame, a demo console, privacy explanation and the canal-lock figure. On desktop web the wallet is interactive in the frame; on narrow web and Android the frame is a preview that opens the wallet full screen. The transfer experience is shared: Home, Choose recipient, Enter amount on a keypad, Review/Confirm, Success. It uses mock balance and recipients, local consent, simple mode, deterministic demonstration rules, a real 30-second cool-down, cancellation, and a clearly labelled family-alert preview. No real money moves.
```

- [ ] **Step 3: Commit**

```bash
git add docs/design-notes.md docs/implementation-plan.md
git commit -m "docs: describe the Current direction"
```

---

### Task 13: Verify on both platforms

**Files:**
- Modify: `docs/validation.md`

- [ ] **Step 1: Project gates**

Run: `npm run lint && npm run typecheck && npm test && npm run export:platforms`
Expected: all pass. 19 tests. Android and web bundles are written to `dist/`.

- [ ] **Step 2: Web checks**

Run: `node scripts/preview.mjs dist 4173`, then check `/` and `/demo` at 412, 768, 1024 and 1440 wide:
- No horizontal scroll at any width. No console errors.
- Normal: Transfer, agree, Next, Review, Confirm. Balance becomes RM 2,450.00.
- Struggling: the recipient step shows the guidance banner and larger controls.
- Coached: review shows the ring, no alert preview, and Continue unlocks after 30 seconds.
- Coached, high with the Aina toggle on: the pause sheet shows the alert preview and "Nothing was sent".
- Guardian declined: Coached, high completes with no pause, and the read-out says monitoring is inactive.
- Amount 9999 shows "This amount exceeds the demo balance."
- Keyboard only: every control reachable with Tab and operable with Enter or Space; digits and Backspace edit the amount.
- With reduced motion emulated: no particle movement, no slide transitions.
- At 1440, while a coached pause counts down, the particle stream is visibly slower.

- [ ] **Step 3: Android checks**

The new native modules need a fresh development build.

Run: `npx expo run:android`
On the emulator or a device, check:
- Landing: serif headline, static flow art, compact console, cropped frame preview. Tapping the preview opens the wallet.
- Wallet: blue header runs under the status bar; nothing is hidden by the status bar or the gesture bar.
- The same five scenarios as Step 2.
- System back steps the transfer backwards, closes a sheet, and leaves the wallet from Home.
- With the system font size at its largest, no label is clipped and no button text is cut.

If no emulator or device is available, say so in the report. A Metro export is not a device test.

- [ ] **Step 4: Record what was and was not verified**

Add a section at the top of `docs/validation.md`, under the title, headed `## Current redesign`, listing each check above with its real outcome and date. Record anything not run as not run. Keep the earlier content below it.

- [ ] **Step 5: Commit**

```bash
git add docs/validation.md
git commit -m "docs: record verification of the Current redesign"
```

---

## Spec coverage

| Spec item | Task |
|---|---|
| Session logic, provider | 2, 3 |
| Wallet views, keypad, sheets | 4, 5 |
| Platform pairs (toggle, action) | 4, 8 |
| Phone frame, island | 6 |
| Flow art, Android static art | 7 |
| Demo console | 8 |
| Lock figure, Android still | 8 |
| Screens and platform table | 9, 10 |
| Tokens | 3 |
| Rules that must survive | 2 (tests), 5 (copy), 13 (checks) |
| Motion and reduced motion | 4, 5, 6, 7, 8, 13 |
| Icons gate | 1 |
| Removed | 11 |
| Errors | 2, 5, 7 |
| Verification | 13 |
