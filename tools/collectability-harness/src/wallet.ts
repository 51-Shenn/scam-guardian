// Mock wallet state: stands in for the "authorised wallet/backend state" in C02.
// Recipient names and account numbers live only here and never reach the collector.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BaselineInfo, TransactionContext, makeId } from './collector';

export type Recipient = { id: string; label: string; detail: string };
type Transfer = { recipientId: string; amountMinor: number; at: number };

export const RECIPIENTS: Recipient[] = [
  { id: 'r_aina', label: 'Aina', detail: 'Daughter, saved contact' },
  { id: 'r_hafiz', label: 'Hafiz', detail: 'Saved contact' },
  { id: 'r_new', label: 'New recipient', detail: 'Enter an account number' },
];

export const BALANCE_MINOR = 250000; // RM 2,500.00
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

// Seeded history so "usual amount" and "recent transfers" have something to work on.
function seededHistory(now: number): Transfer[] {
  return [
    { recipientId: 'r_aina', amountMinor: 5000, at: now - 2 * HOUR },
    { recipientId: 'r_aina', amountMinor: 10000, at: now - 3 * DAY },
    { recipientId: 'r_hafiz', amountMinor: 3000, at: now - 5 * DAY },
    { recipientId: 'r_aina', amountMinor: 5000, at: now - 9 * DAY },
    { recipientId: 'r_hafiz', amountMinor: 8000, at: now - 14 * DAY },
    { recipientId: 'r_aina', amountMinor: 5000, at: now - 20 * DAY },
    { recipientId: 'r_aina', amountMinor: 15000, at: now - 31 * DAY },
  ];
}

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export function transactionContext(recipientId: string | null, amountMinor: number | null): TransactionContext {
  const now = Date.now();
  const history = seededHistory(now);
  const lastTen = history.slice(0, 10).map((t) => t.amountMinor);
  const known = recipientId === null ? null : history.some((t) => t.recipientId === recipientId);
  return {
    amount_minor_units: amountMinor,
    currency: 'MYR',
    is_new_recipient: known === null ? null : !known,
    available_balance_minor_units: BALANCE_MINOR,
    usual_transfer_amount_minor_units: median(lastTen),
    recent_transfer_count: history.filter((t) => now - t.at <= DAY).length,
    recipient_history_count: recipientId === null ? null : history.filter((t) => t.recipientId === recipientId).length,
    context_as_of: new Date(now).toISOString(),
  };
}

// --- Local user keys and baselines (per profile, so users never mix) ---

export type Profile = 'A' | 'B';
const keyFor = (p: Profile) => `harness:profile:${p}:user_key`;
const sessionsFor = (userKey: string) => `harness:user:${userKey}:sessions`;
export const MIN_BASELINE_SESSIONS = 5;

export async function userKeyFor(profile: Profile): Promise<string> {
  const existing = await AsyncStorage.getItem(keyFor(profile));
  if (existing) return existing;
  const fresh = makeId();
  await AsyncStorage.setItem(keyFor(profile), fresh);
  return fresh;
}

type Summary = Record<string, number | null>;

export async function loadBaseline(userKey: string): Promise<BaselineInfo> {
  const raw = await AsyncStorage.getItem(sessionsFor(userKey));
  const sessions: Summary[] = raw ? JSON.parse(raw) : [];
  const counts: Record<string, number> = {};
  const sums: Record<string, number> = {};
  for (const s of sessions) {
    for (const [k, v] of Object.entries(s)) {
      if (typeof v !== 'number') continue;
      counts[k] = (counts[k] ?? 0) + 1;
      sums[k] = (sums[k] ?? 0) + v;
    }
  }
  const available = sessions.length >= MIN_BASELINE_SESSIONS;
  const stats: Record<string, number> = {};
  for (const k of Object.keys(sums)) stats[`${k}_mean`] = Math.round(sums[k] / counts[k]);
  return {
    baseline_version: available ? `harness-baseline-${sessions.length}` : null,
    eligible_session_count: sessions.length,
    feature_observation_counts: counts,
    baseline_statistics: available ? stats : null,
    baseline_available: available,
    baseline_quality_status: available ? 'available' : 'insufficient',
  };
}

// Harness policy (placeholder for the real one): only confirmed sessions count.
export async function addBaselineSession(userKey: string, summary: Summary) {
  const raw = await AsyncStorage.getItem(sessionsFor(userKey));
  const sessions: Summary[] = raw ? JSON.parse(raw) : [];
  sessions.push(summary);
  await AsyncStorage.setItem(sessionsFor(userKey), JSON.stringify(sessions.slice(-20)));
}

export async function dumpStorage(): Promise<string> {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('harness:'));
  const pairs = await AsyncStorage.multiGet(keys);
  return JSON.stringify(pairs);
}

export async function resetStorage() {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('harness:'));
  await AsyncStorage.multiRemove(keys);
}
