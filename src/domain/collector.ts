import type { DemoEvent } from './contract.ts';
import { recipients, type Action, type RecipientId, type Session } from './session.ts';

/** An event before the recorder gives it a session, sequence number and time. */
export type Draft = Pick<DemoEvent, 'type' | 'source' | 'payload'>;
export type Outcome = 'confirmed' | 'cancelled' | 'abandoned';
export type Field = 'recipient' | 'amount';

/** Mock history behind each recipient. Only counts reach the model, never names or account numbers. */
const HISTORY: Record<RecipientId, number> = { aina: 8, hafiz: 3, fresh: 0 };
export const RECENT_TRANSFERS = 2;
export const HISTORY_WINDOW_MS = 2592000000;

function minorUnits(amount: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(amount)) return null;
  const [whole, cents = ''] = amount.split('.');
  return Number(whole) * 100 + Number(cents.padEnd(2, '0'));
}

/** The mock wallet's state as the model's transaction context. The recorder stamps context_as_of_ms. */
export function transactionDraft(s: Session): Draft {
  return {
    type: 'transaction', source: 'mock_wallet',
    payload: {
      amount_minor_units: minorUnits(s.amount), currency: 'MYR', is_new_recipient: recipients[s.to].fresh,
      available_balance_minor_units: Math.round(s.balance * 100), recent_transfer_count: RECENT_TRANSFERS,
      recipient_history_count: HISTORY[s.to], history_window_ms: HISTORY_WINDOW_MS, context_as_of_ms: 0,
    },
  } as Draft;
}

const draft = (type: string, source: string, payload: object) => ({ type, source, payload }) as Draft;
const navigate = (step_id: string, direction: 'forward' | 'back') => draft('navigate', 'observed_ui', { step_id, direction });
const blur = (field_id: Field) => draft('blur', 'observed_ui', { field_id });

export interface Collected {
  /** A monitored transfer begins: the recorder opens a session and records session_start first. */
  readonly start: boolean;
  readonly drafts: Draft[];
  readonly end: Outcome | null;
}

/**
 * Turns one bank-app action into contract events. Monitoring covers only an opted-in transfer, from the
 * recipient step until confirmation or cancellation. Only field identifiers and length changes are kept.
 */
export class Collector {
  private open = false;
  private amountFocused = false;

  get active(): boolean { return this.open; }

  /** The amount keypad stands in for the amount field: the first key is its user focus, leaving the step its blur. */
  private amountInput(drafts: Draft[]) {
    if (!this.amountFocused) drafts.push(draft('focus', 'observed_ui', { field_id: 'amount', origin: 'user' }));
    this.amountFocused = true;
  }

  private leaveAmount(drafts: Draft[]) {
    if (this.amountFocused) drafts.push(blur('amount'));
    this.amountFocused = false;
  }

  observe(action: Action, prev: Session, next: Session): Collected {
    const none: Collected = { start: false, drafts: [], end: null };
    const begins = prev.step === 'home' && next.step === 'recipient' && next.consent;
    if (begins) {
      this.open = true;
      this.amountFocused = false;
      return { start: true, drafts: [transactionDraft(next)], end: null };
    }
    if (!this.open) return none;
    const drafts: Draft[] = [];
    const finish = (end: Outcome, event?: Draft): Collected => {
      this.open = false;
      return { start: false, drafts: event ? [event] : [], end };
    };
    switch (action.type) {
      case 'scenario': case 'reset': return finish('abandoned');
      case 'pick': if (prev.to !== next.to) drafts.push(transactionDraft(next)); break;
      case 'account': {
        const delta = next.account.length - prev.account.length;
        if (delta) drafts.push(draft('edit', 'observed_ui', { field_id: 'recipient', length_delta: delta, input_source: action.pasted ? 'explicit_paste' : 'unknown' }));
        break;
      }
      case 'next': if (next.step === 'amount') drafts.push(navigate('amount', 'forward')); break;
      case 'key': case 'setAmount': {
        const delta = next.amount.length - prev.amount.length;
        if (next.amount === prev.amount) break;
        this.amountInput(drafts);
        // The on-screen keypad is a verified typing source; a quick-amount chip replaces the value.
        drafts.push(draft('edit', 'observed_ui', { field_id: 'amount', length_delta: delta, input_source: action.type === 'key' ? 'typing' : 'unknown' }));
        break;
      }
      case 'review': if (next.step === 'review') { this.leaveAmount(drafts); drafts.push(transactionDraft(next), navigate('review', 'forward')); } break;
      case 'back':
        if (next.step === 'home') return finish('cancelled', draft('cancel', 'observed_ui', {}));
        if (prev.step === 'amount') this.leaveAmount(drafts);
        if (next.step !== prev.step) drafts.push(navigate(next.step, 'back'));
        break;
      case 'help': drafts.push(draft('help', 'observed_ui', { step_id: prev.step })); break;
      case 'toggleCall': drafts.push(draft('simulated_context', 'simulation_button', { signal: 'call', state: next.call ? 'active' : 'inactive' })); break;
      case 'confirm': if (next.step === 'success') return finish('confirmed', draft('confirm', 'observed_ui', {})); break;
      case 'cancel': return finish('cancelled', draft('cancel', 'observed_ui', {}));
      default: break;
    }
    return { start: false, drafts, end: null };
  }

  /** The account-number field's focus. Origin is user only when a touch or click on the field just came first. */
  focus(field: Field, fromTouch: boolean): Draft[] {
    return this.open ? [draft('focus', 'observed_ui', { field_id: field, origin: fromTouch ? 'user' : 'unknown' })] : [];
  }

  blur(field: Field): Draft[] {
    return this.open ? [blur(field)] : [];
  }

  /** App lifecycle and window focus, only while a transfer is monitored. */
  lifecycle(state: 'active' | 'inactive' | 'background'): Draft[] {
    return this.open ? [draft('app_state', 'observed_lifecycle', { state })] : [];
  }

  windowFocus(focused: boolean): Draft[] {
    return this.open ? [draft('window_focus', 'observed_lifecycle', { focused })] : [];
  }
}
