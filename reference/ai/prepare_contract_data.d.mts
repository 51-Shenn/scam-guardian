// Minimal types for the AI team's reference script, used only by parity tests.
export interface ReferenceEvent { seq: number; tMs: number; type: string; [key: string]: unknown }
export interface ReferenceSession {
  metadata: { sessionId: string; localUserKey: string };
  availability: { editing: string; inputSource: string };
  events: ReferenceEvent[];
  researchAnnotations: { confirmedAtMs: number; scenario: string; role: string };
}
export function generateSession(config: unknown, userIndex: number, ordinal: number, split: string): ReferenceSession;
export function augmentSession(parent: ReferenceSession, kind: string, config: unknown): ReferenceSession;
export function featuresAt(session: ReferenceSession, cutoff: number, config: unknown): { features: Record<string, number | null> };
