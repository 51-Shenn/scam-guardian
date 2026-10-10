// Minimal types for the AI team's request-context script, used only by tests.
import type { RequestContext } from '../../src/domain/contract.ts';
import type { DemoRequest } from '../../src/domain/request.ts';
import type { ReferenceSession } from './prepare_contract_data.mjs';

export function requestFeatures(input: DemoRequest | null): RequestContext;
export function sessionsFor(config: unknown, userIndex: number, split: string): (ReferenceSession & { paymentRequests?: { at: number; input: DemoRequest | null }[] })[];
