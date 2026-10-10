import { canConfirm, evaluate, validateAmount, type Decision, type Scenario, type Signals } from './risk.ts';
import type { DemoRequestId } from './request.ts';
import type { LinearExplanation } from './explanation.ts';

export type Step = 'home' | 'recipient' | 'amount' | 'review' | 'success';
export type RecipientId = 'aina' | 'hafiz' | 'fresh';
export type SheetName = 'consent' | 'pause';
/** How the new recipient's account number arrived. Only this flag leaves the field, never the number or the clipboard. */
export type Entry = 'typed' | 'pasted';

export const COOL_DOWN_MS = 15000;
export const USUAL_AMOUNT = 50;
/** Malaysian bank account numbers run from 10 to 16 digits. */
export const ACCOUNT_MIN_DIGITS = 10;
export const ACCOUNT_MAX_DIGITS = 16;

// Fixtures are demo signals. Nothing here is observed from the device.
// Choosing one presets the simulated call and who the next transfer starts with; the person then types the rest.
export interface Fixture { label: string; note: string; to: RecipientId; call: boolean; back: number }
export const fixtures: Record<Scenario, Fixture> = {
  normal: { label: 'Normal', note: 'Saved contact, a usual amount such as RM 50', to: 'aina', call: false, back: 0 },
  struggling: { label: 'Struggling', note: 'Repeated back navigation', to: 'aina', call: false, back: 3 },
  medium: { label: 'Coached', note: 'Call active, new recipient: type the account number', to: 'fresh', call: true, back: 0 },
  coached: { label: 'Coached, high', note: 'Call active, new recipient: paste the account number', to: 'fresh', call: true, back: 0 },
};
export const scenarios = Object.keys(fixtures) as Scenario[];

export interface Recipient { name: string; meta: string; initial: string; fresh: boolean }
export const recipients: Record<RecipientId, Recipient> = {
  aina: { name: 'Aina', meta: 'Daughter, saved contact', initial: 'A', fresh: false },
  hafiz: { name: 'Hafiz', meta: 'Saved contact', initial: 'H', fresh: false },
  fresh: { name: 'New recipient', meta: 'Enter an account number', initial: '', fresh: true },
};
export const recipientIds = Object.keys(recipients) as RecipientId[];

/** The on-device model's latest answer for this transfer. A binary review, never a probability. */
export interface AiView {
  status: 'off' | 'waiting' | 'unavailable' | 'clear' | 'review';
  /** Uncalibrated simulation-trained review score and its frozen threshold. */
  score: number | null;
  threshold: number | null;
  model: string | null;
  cutoff: number | null;
  /** Once the model recommends a review, it stays recommended for the rest of the transfer. */
  latched: boolean;
  /** The first positive LR prefix, retained even if a later score falls below threshold. */
  triggerExplanation?: LinearExplanation | null;
}
export const AI_OFF: AiView = { status: 'off', score: null, threshold: null, model: null, cutoff: null, latched: false };
export const AI_WAITING: AiView = { ...AI_OFF, status: 'waiting' };
/** The contract's recommended wording for an AI review. */
export const AI_REVIEW_REASON = 'Pause and verify this payment through a contact you already trust';

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
  /** The new recipient's account number, digits only. It stays in the field and is never recorded. */
  account: string;
  entry: Entry | null;
  call: boolean;
  /** Simulated switch to another app. A demo signal only: it is never an observed app state. */
  away: boolean;
  /** When the current simulated switch began, and the away time already finished during this transfer. */
  awaySince: number | null;
  awayMs: number;
  help: number;
  back: number;
  deadline: number | null;
  sheet: SheetName | null;
  error: string | null;
  hidden: boolean;
  ai: AiView;
  demoRequest: DemoRequestId | null;
  requestShown: boolean;
}
export const initialSession: Session = {
  step: 'home', scenario: 'normal', consent: false, family: false, asked: false, pendingStart: false, balance: 12500,
  amount: '', to: 'aina', account: '', entry: null, call: false, away: false, awaySince: null, awayMs: 0, help: 0, back: 0, deadline: null, sheet: null, error: null, hidden: false, ai: AI_OFF,
  demoRequest: null, requestShown: false,
};

export type Action =
  | { type: 'scenario'; scenario: Scenario }
  | { type: 'transfer' } | { type: 'openConsent' } | { type: 'toggleFamily' } | { type: 'agree' } | { type: 'decline' } | { type: 'closeSheet' }
  | { type: 'toggleCall'; now: number } | { type: 'toggleAway'; now: number } | { type: 'reset' }
  | { type: 'pick'; to: RecipientId } | { type: 'account'; value: string; pasted: boolean } | { type: 'next' }
  | { type: 'key'; key: string } | { type: 'setAmount'; amount: string }
  | { type: 'review'; now: number } | { type: 'confirm'; now: number }
  | { type: 'back' } | { type: 'help' } | { type: 'cancel' } | { type: 'done' } | { type: 'toggleHidden' }
  | { type: 'ai'; ai: AiView; now: number }
  // Independently selected from evaluation labels and rule presets.
  | { type: 'selectRequest'; request: DemoRequestId | null } | { type: 'revealRequest' };

export interface Derived {
  fixture: Fixture;
  active: boolean;
  /** False while a new recipient has no complete account number yet. */
  ready: boolean;
  signals: Signals;
  monitoring: boolean;
  decision: Decision;
  /** What raised the current intervention: the demo rules, the on-device model, or both. */
  origin: 'rule' | 'ai' | 'combined' | null;
  /** Guidance is showing: one instruction for the current step. */
  simple: boolean;
  /** Controls are enlarged. Repeated back steps do this; asking for help never changes sizes. */
  large: boolean;
  paused: boolean;
  locked: boolean;
  remaining: number;
  fraction: number;
  alert: boolean;
  /** Simulated time in another app during this transfer, including the current switch. */
  awayMs: number;
}

const intervenes = (decision: Decision) => decision.response === 'hold' || decision.response === 'cooldown';

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
  const rules = monitoring ? evaluate(signals) : idle;
  const ai = monitoring && session.ai.latched;
  // A model review adds a cool-down; it never overrides a stronger rule response.
  const decision: Decision = ai && !intervenes(rules)
    ? { classification: 'Coached', response: 'cooldown', reasons: [AI_REVIEW_REASON] }
    : ai ? { ...rules, reasons: [...rules.reasons, AI_REVIEW_REASON] } : rules;
  const origin = intervenes(rules) ? (ai ? 'combined' : 'rule') : ai ? 'ai' : null;
  const paused = session.deadline !== null || intervenes(decision);
  const left = session.deadline === null ? 0 : Math.min(COOL_DOWN_MS, Math.max(0, session.deadline - now));
  return {
    fixture, active, signals, monitoring, decision, origin, paused,
    ready: !fresh || session.account.length >= ACCOUNT_MIN_DIGITS,
    simple: active && (rules.response === 'guide' || session.help > 0),
    large: monitoring && evaluate({ ...signals, helpTaps: 0 }).response === 'guide',
    locked: paused && (session.deadline === null || !canConfirm(session.deadline, now)),
    remaining: Math.ceil(left / 1000),
    fraction: left / COOL_DOWN_MS,
    alert: session.family && session.deadline !== null && decision.response === 'hold',
    awayMs: session.awayMs + (session.away && session.awaySince !== null ? Math.max(0, now - session.awaySince) : 0),
  };
}

const home = (session: Session): Session => ({ ...session, step: 'home', deadline: null, error: null, sheet: null, pendingStart: false });

function start(session: Session): Session {
  const fixture = fixtures[session.scenario];
  return {
    ...session, step: 'recipient', amount: '', to: fixture.to, account: '', entry: null, help: 0, back: 0, deadline: null, error: null, sheet: null, awayMs: 0,
    pendingStart: false, ai: session.consent ? AI_WAITING : AI_OFF, requestShown: false,
  };
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

/** Keeps digits only, capped at the longest account number. A paste marks the entry until the field is cleared. */
function enterAccount(session: Session, value: string, pasted: boolean): Session {
  const account = value.replace(/\D/g, '').slice(0, ACCOUNT_MAX_DIGITS);
  const entry: Entry | null = !account ? null : pasted || session.entry === 'pasted' ? 'pasted' : 'typed';
  return { ...session, account, entry };
}

export function reduce(session: Session, action: Action): Session {
  switch (action.type) {
    case 'selectRequest': return session.step === 'home' ? { ...session, demoRequest: action.request, requestShown: false } : session;
    case 'revealRequest': return derive(session, 0).monitoring && session.demoRequest && !session.requestShown ? { ...session, requestShown: true } : session;
    case 'scenario': return { ...home(session), scenario: action.scenario, call: fixtures[action.scenario].call, away: false, awaySince: null, awayMs: 0 };
    case 'toggleCall': return hold({ ...session, call: !session.call }, action.now);
    // The person can keep using the bank app while the simulated switch says they are away.
    case 'toggleAway': return session.away
      ? { ...session, away: false, awaySince: null, awayMs: session.awayMs + Math.max(0, action.now - (session.awaySince ?? action.now)) }
      : { ...session, away: true, awaySince: action.now };
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
    case 'pick': return session.step === 'recipient' ? { ...session, to: action.to, ...(recipients[action.to].fresh ? {} : { account: '', entry: null }) } : session;
    case 'account': return session.step === 'recipient' && recipients[session.to].fresh ? enterAccount(session, action.value, action.pasted) : session;
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
    // A late answer for a transfer that has ended is dropped.
    case 'ai': return session.step === 'recipient' || session.step === 'amount' || session.step === 'review' ? hold({ ...session, ai: action.ai }, action.now) : session;
  }
}

export function money(value: number | string): string {
  const [whole, cents] = (Number(value) || 0).toFixed(2).split('.');
  return `RM ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${cents}`;
}

/** Shows an account number in groups of four for reading back; it is never stored outside the field. */
export function groupDigits(digits: string): string {
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}
