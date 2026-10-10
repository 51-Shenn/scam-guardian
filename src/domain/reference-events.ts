// Test support only: rewrites the AI team's reference sessions into the contract events the app's collector emits.
// The app never imports this file.
import type { DemoEvent } from './contract.ts';
import { requestFeatures, type DemoRequest } from './request.ts';

export interface ReferenceSessionLike {
  readonly metadata: { readonly sessionId: string };
  readonly events: readonly Record<string, any>[];
  readonly paymentRequests?: readonly { readonly at: number; readonly input: DemoRequest | null }[];
}

export function toContractEvents(s: ReferenceSessionLike): DemoEvent[] {
  let step = 'recipient';
  const id = s.metadata.sessionId;
  const events: Record<string, unknown>[] = s.events.map((e) => {
    const head = { session_id: id, event_seq: e.seq, event_t_ms: e.tMs, type: e.type };
    switch (e.type) {
      case 'session_start': return { ...head, source: 'observed_ui', payload: { step_id: e.stepId } };
      case 'transaction': return { ...head, source: 'mock_wallet', payload: {
        amount_minor_units: e.amountMinorUnits, currency: e.currency, is_new_recipient: e.isNewRecipient,
        available_balance_minor_units: e.availableBalanceMinorUnits, recent_transfer_count: e.recentTransferCount,
        recipient_history_count: e.recipientHistoryCount, history_window_ms: e.historyWindowMs, context_as_of_ms: e.contextAsOfMs } };
      case 'edit': return { ...head, source: 'observed_ui', payload: { field_id: e.fieldId, length_delta: e.lengthDelta, input_source: e.inputSource } };
      case 'focus': return { ...head, source: 'observed_ui', payload: { field_id: e.fieldId, origin: e.origin } };
      case 'blur': return { ...head, source: 'observed_ui', payload: { field_id: e.fieldId } };
      case 'navigate': step = e.stepId; return { ...head, source: 'observed_ui', payload: { step_id: e.stepId, direction: e.direction } };
      case 'help': return { ...head, source: 'observed_ui', payload: { step_id: step } };
      case 'app_state': return { ...head, source: 'observed_lifecycle', payload: { state: e.state } };
      case 'window_focus': return { ...head, source: 'observed_lifecycle', payload: { focused: e.focused } };
      case 'confirm': return { ...head, source: 'observed_ui', payload: {} };
      default: throw Error(`unmapped reference event ${e.type}`);
    }
  });
  // An authored request is shown at its logged time and recorded as its encoded cues.
  for (const r of s.paymentRequests ?? []) {
    events.push({ session_id: id, event_seq: -1, event_t_ms: r.at, type: 'request_context', source: 'authored_demo_request', payload: requestFeatures(r.input) });
  }
  return events
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (a.e.event_t_ms as number) - (b.e.event_t_ms as number) || a.i - b.i)
    .map(({ e }, i) => ({ ...e, event_seq: i })) as unknown as DemoEvent[];
}
