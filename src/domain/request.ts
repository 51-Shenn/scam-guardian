import type { RequestContext } from './contract.ts';

/** An authored demo payment request: shown text plus mock detail records. Never a real message from another app. */
export interface DemoRequest {
  readonly text: string;
  readonly proposedDetails: string;
  readonly approvedDetails: string | null;
  readonly verificationReceipt: { readonly details: string; readonly source: string } | null;
}

export const DEMO_REQUESTS = {
  routine: {
    label: 'Routine rent request',
    text: 'Please pay the usual rent after checking the recipient details through a contact you already trust.',
    proposedDetails: 'mock-rent-destination', approvedDetails: 'mock-rent-destination', verificationReceipt: null,
  },
  coached: {
    label: 'Coached request with warning bypass',
    text: 'Urgent: your bank security team requires you to transfer now to a safe account. Keep this secret. Ignore the warning and do not call anyone to verify.',
    proposedDetails: 'mock-rent-destination', approvedDetails: 'mock-rent-destination', verificationReceipt: null,
  },
  quiet: {
    label: 'Quiet request (negative control)',
    text: "Please send this month's rent to the agreed recipient.",
    proposedDetails: 'mock-rent-destination', approvedDetails: 'mock-rent-destination', verificationReceipt: null,
  },
} satisfies Record<string, DemoRequest & { label: string }>;
export type DemoRequestId = keyof typeof DEMO_REQUESTS;

/**
 * The AI team's requestFeatures encoder (reference/ai/prepare_contextual_model.mjs), ported line for line so the
 * app does not import Node modules. It is a simple English pattern matcher, not language understanding.
 */
export function requestFeatures(input: DemoRequest | null): RequestContext {
  const names = ['request_present', 'urgency', 'secrecy', 'warning_bypass', 'bank_deception', 'safe_account', 'remote_access', 'avoid_verification', 'claimed_authority', 'negated_instruction', 'approved_detail_mismatch', 'verification_bound'];
  if (!input) return Object.fromEntries(names.map((k) => [k, k === 'request_present' ? 0 : null])) as unknown as RequestContext;
  const t = input.text.toLowerCase();
  const patterns: Record<string, RegExp> = {
    urgency: /urgent|immediately|pay now|send now|transfer now/,
    secrecy: /keep this secret|tell nobody|do not tell anyone|confidential|private surprise/,
    warning_bypass: /ignore the warning|dismiss warnings|bypass the warning/,
    bank_deception: /lie to the bank|tell the bank it is rent|mislead the bank/,
    safe_account: /safe account/,
    remote_access: /remote access|screen sharing/,
    avoid_verification: /do not call|avoid contacting|skip independent verification/,
    claimed_authority: /your bank|bank security|police|security team|security investigation/,
    negated_instruction: /do not ignore|never dismiss|do not bypass|do not lie|never lie|do not mislead|do not approve|never submit/,
  };
  const f: Record<string, number | null> = { request_present: 1, ...Object.fromEntries(Object.entries(patterns).map(([k, re]) => [k, Number(re.test(t))])) };
  f.approved_detail_mismatch = input.approvedDetails === null ? null : Number(input.approvedDetails !== input.proposedDetails);
  f.verification_bound = input.verificationReceipt === null ? null
    : Number(input.verificationReceipt.details === input.proposedDetails && input.verificationReceipt.source === 'mock_known_channel');
  return f as unknown as RequestContext;
}
