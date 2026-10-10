import type { Session, Derived } from './session.ts';
import { DEMO_REQUESTS, requestFeatures } from './request.ts';

export interface DecisionSupport {
  readonly category: string;
  readonly priority: 'Check before confirmation' | 'Offer guidance' | 'Continue reviewing' | 'Assessment unavailable';
  readonly reason: string;
  readonly action: string;
  readonly basis: string;
}

/** Display policy only. Categories/priorities are not additional learned outputs or proof of fraud. */
export function decisionSupport(session: Session, view: Derived): DecisionSupport {
  if (!view.monitoring) return { category: 'Monitoring inactive', priority: 'Continue reviewing',
    reason: 'Guardian monitors opted-in transfers only.', action: 'Choose whether to turn on Guardian for this transfer.', basis: 'Consent policy' };
  if (view.origin) {
    const cues = session.requestShown && session.demoRequest ? requestFeatures(DEMO_REQUESTS[session.demoRequest]) : null;
    const category = cues?.warning_bypass === 1 && cues.negated_instruction !== 1 ? 'Warning bypass instructions'
      : cues?.approved_detail_mismatch === 1 && cues.verification_bound !== 1 ? 'Account change needs checking'
        : view.signals.callActive && view.signals.newRecipient ? 'Possible external direction' : 'Payment journey needs review';
    const reason = category === 'Warning bypass instructions' ? 'The instructions ask you to ignore warnings.'
      : category === 'Account change needs checking' ? 'The mock account change has no check bound to the proposed details.'
        : category === 'Possible external direction' ? 'A simulated call is active while paying a new recipient.'
          : 'The frozen model recommended review from the available payment evidence.';
    return { category, priority: 'Check before confirmation', reason,
      action: 'Pause. Contact the recipient using a route you already trust. Cancel if you cannot check independently.',
      basis: `${view.origin === 'ai' ? 'AI' : view.origin === 'rule' ? 'Rules' : 'Rules + AI'} triggered review; category and priority come from display policy` };
  }
  if (session.ai.status === 'unavailable') return { category: 'AI assessment unavailable', priority: 'Assessment unavailable',
    reason: 'The model could not assess this prefix. This is not a safe result.', action: 'Review the recipient and instructions independently.', basis: 'Failure policy; transaction rules remain active' };
  if (view.simple) return { category: 'Navigation difficulty', priority: 'Offer guidance', reason: 'Extra navigation or help requests may mean the person needs assistance.',
    action: 'Use Simple mode and review one step at a time.', basis: 'Guidance policy; difficulty alone is not a scam allegation' };
  return { category: 'No review trigger', priority: 'Continue reviewing', reason: 'No available evidence has triggered a review so far.',
    action: 'Check the recipient and amount as usual. No warning does not establish safety.', basis: 'Current rules and AI status; not a safety guarantee' };
}
