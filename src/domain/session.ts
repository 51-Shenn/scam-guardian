import { canConfirm, evaluate, validateAmount, type Decision, type Scenario, type Signals } from './risk.ts';

export type Step = 'home' | 'recipient' | 'amount' | 'review' | 'success';
export type RecipientId = 'aina' | 'hafiz' | 'fresh';
export type SheetName = 'consent' | 'pause';
/** How the new recipient's account number arrived. Only this flag is kept, never the clipboard. */
export type Entry = 'typed' | 'pasted';

export const COOL_DOWN_MS = 30000;
export const USUAL_AMOUNT = 50;
/** Shown for the new recipient. A made-up number, not a real account. */
export const DEMO_ACCOUNT = '8830 1274 5521';

// Fixtures are demo signals. Nothing here is observed from the device.
// Choosing one presets the simulated call and what the next transfer starts with; both can then be changed by hand.
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
  fresh: { name: 'New recipient', meta: 'Enter an account number', initial: '', fresh: true },
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
  entry: Entry | null;
  call: boolean;
  help: number;
  back: number;
  deadline: number | null;
  sheet: SheetName | null;
  error: string | null;
  hidden: boolean;
}
export const initialSession: Session = {
  step: 'home', scenario: 'normal', consent: false, family: false, asked: false, pendingStart: false, balance: 2500,
  amount: '50', to: 'aina', entry: null, call: false, help: 0, back: 0, deadline: null, sheet: null, error: null, hidden: false,
};

export type Action =
  | { type: 'scenario'; scenario: Scenario }
  | { type: 'transfer' } | { type: 'openConsent' } | { type: 'toggleFamily' } | { type: 'agree' } | { type: 'decline' } | { type: 'closeSheet' }
  | { type: 'toggleCall'; now: number } | { type: 'reset' }
  | { type: 'pick'; to: RecipientId } | { type: 'entry'; entry: Entry } | { type: 'next' }
  | { type: 'key'; key: string } | { type: 'setAmount'; amount: string }
  | { type: 'review'; now: number } | { type: 'confirm'; now: number }
  | { type: 'back' } | { type: 'help' } | { type: 'cancel' } | { type: 'done' } | { type: 'toggleHidden' };

export interface Derived {
  fixture: Fixture;
  active: boolean;
  /** False while a new recipient has no account number yet. */
  ready: boolean;
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
  const fresh = recipients[session.to].fresh;
  const signals: Signals = {
    callActive: session.call, newRecipient: fresh, pasted: fresh && session.entry === 'pasted',
    amountRatio: Number(session.amount) / USUAL_AMOUNT || 0, backPresses: session.back + fixture.back, helpTaps: session.help,
  };
  const monitoring = session.consent && active;
  const idle: Decision = { classification: 'Normal', response: 'continue', reasons: [session.consent ? 'Monitoring starts at the recipient step' : 'Guardian is off for this account'] };
  const decision = monitoring ? evaluate(signals) : idle;
  const paused = session.deadline !== null || decision.response === 'hold' || decision.response === 'cooldown';
  const left = session.deadline === null ? 0 : Math.min(COOL_DOWN_MS, Math.max(0, session.deadline - now));
  return {
    fixture, active, signals, monitoring, decision, paused,
    ready: !fresh || session.entry !== null,
    simple: active && (decision.response === 'guide' || session.help > 0),
    locked: paused && (session.deadline === null || !canConfirm(session.deadline, now)),
    remaining: Math.ceil(left / 1000),
    fraction: left / COOL_DOWN_MS,
    alert: session.family && session.deadline !== null && decision.response === 'hold',
  };
}

const home = (session: Session): Session => ({ ...session, step: 'home', deadline: null, error: null, sheet: null, pendingStart: false });

function start(session: Session): Session {
  const fixture = fixtures[session.scenario];
  const entry = fixture.to !== 'fresh' ? null : fixture.paste ? 'pasted' : 'typed';
  return { ...session, step: 'recipient', amount: fixture.amount, to: fixture.to, entry, help: 0, back: 0, deadline: null, error: null, sheet: null, pendingStart: false };
}

/** Starts the cool-down the first time a transfer under review needs one. */
function hold(session: Session, now: number): Session {
  return session.step === 'review' && session.deadline === null && derive(session, now).paused ? { ...session, deadline: now + COOL_DOWN_MS, sheet: 'pause' } : session;
}

function typeKey(amount: string, key: string): string {
  if (key === 'del') return amount.slice(0, -1);
  if (key === '.') return amount.includes('.') ? amount : `${amount || '0'}.`;
  if (!/^\d$/.test(key) || /\.\d\d$/.test(amount) || amount.length >= 8) return amount;
  return amount === '0' ? key : amount + key;
}

export function reduce(session: Session, action: Action): Session {
  switch (action.type) {
    case 'scenario': return { ...home(session), scenario: action.scenario, call: fixtures[action.scenario].call };
    case 'toggleCall': return hold({ ...session, call: !session.call }, action.now);
    case 'reset': return initialSession;
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
    case 'pick': return session.step === 'recipient' ? { ...session, to: action.to, entry: recipients[action.to].fresh ? session.entry : null } : session;
    case 'entry': return session.step === 'recipient' && recipients[session.to].fresh ? { ...session, entry: action.entry } : session;
    case 'next': return session.step === 'recipient' && derive(session, 0).ready ? { ...session, step: 'amount' } : session;
    case 'key': return session.step === 'amount' ? { ...session, amount: typeKey(session.amount, action.key), error: null } : session;
    case 'setAmount': return session.step === 'amount' ? { ...session, amount: action.amount, error: null } : session;
    case 'review': {
      if (session.step !== 'amount') return session;
      const error = validateAmount(session.amount, session.balance);
      if (error) return { ...session, error };
      return hold({ ...session, error: null, step: 'review' }, action.now);
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
