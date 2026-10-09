import { StatusBar } from 'expo-status-bar';
import * as Application from 'expo-application';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BackSource, BaselineInfo, FieldId, SessionCollector, StepId } from './src/collector';
import {
  BALANCE_MINOR,
  Profile,
  RECIPIENTS,
  addBaselineSession,
  dumpStorage,
  loadBaseline,
  resetStorage,
  transactionContext,
  userKeyFor,
} from './src/wallet';

const ORDER: StepId[] = ['recipient', 'amount', 'review', 'done'];
const isWeb = Platform.OS === 'web';
const appBuild = Application.nativeBuildVersion ?? process.env.EXPO_PUBLIC_APP_BUILD ?? null;

// Malaysian format: comma groups thousands, dot marks sen. Parsed as integers so no
// floating-point rounding; anything else (e.g. 3 decimal places) is rejected as null.
const AMOUNT_PATTERN = /^(\d{1,3}(,\d{3})+|\d+)(\.\d{1,2})?$/;
export const toMinor = (text: string): number | null => {
  const t = text.trim();
  if (!AMOUNT_PATTERN.test(t)) return null;
  const [whole, frac = ''] = t.replace(/,/g, '').split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'));
};

// Flattens the snapshot into "path: value" rows for the live panel.
function flatten(obj: unknown, prefix = ''): [string, unknown][] {
  if (obj === null || typeof obj !== 'object') return [[prefix, obj]];
  const rows: [string, unknown][] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) rows.push([path, '{}']);
    else if (v !== null && typeof v === 'object') rows.push(...flatten(v, path));
    else rows.push([path, v]);
  }
  return rows;
}

export default function App() {
  const [profile, setProfile] = useState<Profile>('A');
  const [collector, setCollector] = useState<SessionCollector | null>(null);
  const [baseline, setBaseline] = useState<BaselineInfo | null>(null);
  const [, setTick] = useState(0);
  const [step, setStep] = useState<StepId>('recipient');
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [warningVisible, setWarningVisible] = useState(false);
  const [leakResult, setLeakResult] = useState<string | null>(null);
  const [storageDump, setStorageDump] = useState<string | null>(null);
  const pendingInAppBack = useRef(false);
  const attached = useRef(new WeakSet<object>());
  const collectorRef = useRef<SessionCollector | null>(null);
  collectorRef.current = collector;

  const startSession = useCallback(async (p: Profile) => {
    collectorRef.current?.end('abandoned');
    const key = await userKeyFor(p);
    setBaseline(await loadBaseline(key));
    setCollector(new SessionCollector(key, appBuild));
    setStep('recipient');
    setRecipientId(null);
    setAccount('');
    setAmount('');
    setReference('');
    setWarningVisible(false);
    setLeakResult(null);
    if (isWeb) window.history.replaceState({ step: 'recipient' }, '');
  }, []);

  useEffect(() => {
    startSession(profile);
  }, [profile, startSession]);

  // Refresh the live panel.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  // C05 lifecycle.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => collectorRef.current?.appState(s));
    return () => sub.remove();
  }, []);

  const goTo = useCallback((to: StepId, source?: BackSource) => {
    const c = collectorRef.current;
    if (!c) return;
    const from = ORDER.indexOf(c.step);
    const event = ORDER.indexOf(to) < from ? 'back' : 'forward';
    c.navigate(to, event, event === 'back' ? source : undefined);
    setStep(to);
  }, []);

  const previous = (s: StepId): StepId | null => {
    const i = ORDER.indexOf(s);
    return i > 0 ? ORDER[i - 1] : null;
  };

  // C04 hardware back (Android only).
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const c = collectorRef.current;
      const prev = c ? previous(c.step) : null;
      if (!c || !prev || c.step === 'done') return false;
      goTo(prev, 'hardware');
      return true;
    });
    return () => sub.remove();
  }, [goTo]);

  // Web: browser back/forward, window focus, and document-level interactions.
  useEffect(() => {
    if (!isWeb) return;
    const onPop = (e: PopStateEvent) => {
      const target = (e.state?.step as StepId) ?? 'recipient';
      const source: BackSource = pendingInAppBack.current ? 'in_app' : 'browser';
      pendingInAppBack.current = false;
      goTo(target, source);
    };
    const onPointer = () => collectorRef.current?.interaction('pointer');
    const onKey = () => collectorRef.current?.interaction('key');
    const onBlur = () => collectorRef.current?.windowBlur();
    window.addEventListener('popstate', onPop);
    window.addEventListener('blur', onBlur);
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [goTo]);

  const forward = (to: StepId) => {
    if (isWeb) window.history.pushState({ step: to }, '');
    goTo(to);
  };

  const back = () => {
    const c = collectorRef.current;
    const prev = c ? previous(c.step) : null;
    if (!prev) return;
    if (isWeb) {
      pendingInAppBack.current = true;
      window.history.back();
    } else {
      goTo(prev, 'in_app');
    }
  };

  // C07: on web, listen to the DOM events behind each TextInput.
  const webRef = (field: FieldId) => (el: unknown) => {
    if (!isWeb || !el || attached.current.has(el as object)) return;
    const node = el as HTMLElement;
    if (typeof node.addEventListener !== 'function') return;
    attached.current.add(node);
    node.addEventListener('paste', () => collectorRef.current?.domPaste(field));
    node.addEventListener('compositionstart', () => collectorRef.current?.domComposition(field, 'start'));
    node.addEventListener('compositionend', () => collectorRef.current?.domComposition(field, 'end'));
    node.addEventListener('input', (e) => collectorRef.current?.domInput(field, (e as InputEvent).inputType ?? ''));
  };

  const edit = (field: FieldId, setter: (v: string) => void) => (v: string) => {
    collectorRef.current?.textChange(field, v.length);
    setter(v);
  };

  const fieldProps = (field: FieldId) => ({
    ref: webRef(field),
    onFocus: () => collectorRef.current?.focus(field, 'focus'),
    onBlur: () => collectorRef.current?.focus(field, 'blur'),
  });

  // C08: record when the warning actually became visible.
  useEffect(() => {
    if (!warningVisible) return;
    const id = requestAnimationFrame(() => collectorRef.current?.warningDisplayed());
    return () => cancelAnimationFrame(id);
  }, [warningVisible]);

  const finish = async (outcome: 'confirmed' | 'cancelled') => {
    const c = collectorRef.current;
    if (!c) return;
    c.end(outcome);
    if (outcome === 'confirmed') {
      await addBaselineSession(c.local_user_key, c.summary());
      setBaseline(await loadBaseline(c.local_user_key));
    }
    if (isWeb) window.history.pushState({ step: 'done' }, '');
    setStep('done');
    setWarningVisible(false);
  };

  const snapshot = collector && baseline ? collector.snapshot(transactionContext(recipientId, toMinor(amount)), baseline) : null;

  // Privacy check: typed text, names and account numbers must not appear in
  // anything the collector logs or stores.
  const runLeakCheck = async () => {
    const stored = await dumpStorage();
    setStorageDump(stored);
    const haystack = stored + JSON.stringify(collector?.log ?? []) + JSON.stringify(snapshot);
    const needles = [account, reference, ...RECIPIENTS.map((r) => r.label)].filter((s) => s.trim().length >= 3);
    const found = needles.filter((n) => haystack.includes(n));
    setLeakResult(found.length ? `FAIL: found ${found.map((f) => JSON.stringify(f)).join(', ')}` : `PASS (checked ${needles.length} values)`);
  };

  if (isWeb) {
    (window as unknown as { __harness: unknown }).__harness = {
      snapshot: () => snapshot,
      log: () => collectorRef.current?.log,
    };
  }

  const canNext =
    step === 'recipient' ? recipientId !== null && (recipientId !== 'r_new' || account.length >= 8) : toMinor(amount) !== null;

  return (
    <View style={styles.root} onTouchStart={isWeb ? undefined : () => collectorRef.current?.interaction('touch')}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Scam Guardian · collectability harness</Text>
        <Text style={styles.sub}>
          Platform: {Platform.OS} · Pause threshold 3 s · Balance RM {(BALANCE_MINOR / 100).toFixed(2)}
        </Text>

        <View style={styles.row}>
          {(['A', 'B'] as Profile[]).map((p) => (
            <Pressable key={p} style={[styles.chip, profile === p && styles.chipOn]} onPress={() => setProfile(p)}>
              <Text style={profile === p ? styles.chipTextOn : styles.chipText}>User {p}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.chip} onPress={() => startSession(profile)}>
            <Text style={styles.chipText}>New session</Text>
          </Pressable>
          <Pressable
            style={styles.chip}
            onPress={async () => {
              await resetStorage();
              startSession(profile);
            }}
          >
            <Text style={styles.chipText}>Reset storage</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.stepTitle}>Step: {step}</Text>
            <Pressable onPress={() => collectorRef.current?.help()} accessibilityLabel="Help with this step">
              <Text style={styles.link}>Help</Text>
            </Pressable>
          </View>

          {step === 'recipient' && (
            <View>
              {RECIPIENTS.map((r) => (
                <Pressable
                  key={r.id}
                  style={[styles.option, recipientId === r.id && styles.optionOn]}
                  onPress={() => setRecipientId(r.id)}
                >
                  <Text style={styles.optionLabel}>{r.label}</Text>
                  <Text style={styles.optionDetail}>{r.detail}</Text>
                </Pressable>
              ))}
              {recipientId === 'r_new' && (
                <TextInput
                  {...fieldProps('account_number')}
                  style={styles.input}
                  placeholder="Account number (try typing, then pasting)"
                  inputMode="numeric"
                  keyboardType="number-pad"
                  value={account}
                  onChangeText={edit('account_number', setAccount)}
                />
              )}
            </View>
          )}

          {step === 'amount' && (
            <View>
              <TextInput
                {...fieldProps('amount')}
                style={styles.input}
                placeholder="Amount (RM)"
                inputMode="decimal"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={edit('amount', setAmount)}
              />
              <TextInput
                {...fieldProps('reference')}
                style={styles.input}
                placeholder="Reference (free text: try a Chinese/BM keyboard)"
                value={reference}
                onChangeText={edit('reference', setReference)}
              />
            </View>
          )}

          {step === 'review' && (
            <View>
              <Text style={styles.body}>
                Send RM {amount || '0'} to {RECIPIENTS.find((r) => r.id === recipientId)?.label}
              </Text>
              {warningVisible ? (
                <View style={styles.warning}>
                  <Text style={styles.body}>Test warning: is someone on the phone telling you to do this?</Text>
                  <Pressable
                    style={styles.button}
                    onPress={() => {
                      collectorRef.current?.verified();
                      setWarningVisible(false);
                    }}
                  >
                    <Text style={styles.buttonText}>I checked with family</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={styles.secondary}
                  onPress={() => {
                    collectorRef.current?.warningDecided();
                    setWarningVisible(true);
                  }}
                >
                  <Text style={styles.secondaryText}>Simulate policy warning</Text>
                </Pressable>
              )}
              <Pressable style={styles.button} onPress={() => finish('confirmed')}>
                <Text style={styles.buttonText}>Confirm</Text>
              </Pressable>
              <Pressable style={styles.secondary} onPress={() => finish('cancelled')}>
                <Text style={styles.secondaryText}>Cancel transfer</Text>
              </Pressable>
            </View>
          )}

          {step === 'done' && (
            <View>
              <Text style={styles.body}>Session ended: {collector?.session_outcome}</Text>
              <Pressable style={styles.button} onPress={() => startSession(profile)}>
                <Text style={styles.buttonText}>Start new session</Text>
              </Pressable>
            </View>
          )}

          {step !== 'done' && step !== 'review' && (
            <View style={styles.row}>
              {step !== 'recipient' && (
                <Pressable style={styles.secondary} onPress={back} accessibilityLabel="Back">
                  <Text style={styles.secondaryText}>Back</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.button, !canNext && styles.disabled]}
                disabled={!canNext}
                onPress={() => forward(step === 'recipient' ? 'amount' : 'review')}
              >
                <Text style={styles.buttonText}>Next</Text>
              </Pressable>
            </View>
          )}
          {step === 'review' && (
            <Pressable style={styles.secondary} onPress={back} accessibilityLabel="Back">
              <Text style={styles.secondaryText}>Back</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.stepTitle}>Privacy leak check</Text>
            <Pressable onPress={runLeakCheck} accessibilityLabel="Run privacy leak check">
              <Text style={styles.link}>Run</Text>
            </Pressable>
          </View>
          {leakResult && <Text style={[styles.body, leakResult.startsWith('FAIL') ? styles.bad : styles.good]}>{leakResult}</Text>}
          {storageDump && <Text style={styles.mono}>Stored: {storageDump}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.stepTitle}>Live fields (orange = null / unknown)</Text>
          {snapshot &&
            flatten(snapshot).map(([path, value]) => {
              const missing = value === null || value === 'unknown' || value === 'unavailable';
              return (
                <View key={path} style={styles.fieldRow}>
                  <Text style={styles.fieldPath}>{path}</Text>
                  <Text style={[styles.fieldValue, missing && styles.missing]}>{String(value)}</Text>
                </View>
              );
            })}
        </View>
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f6fb' },
  scroll: { padding: 16, paddingTop: 48, maxWidth: 720, width: '100%', alignSelf: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#0b1b3f' },
  sub: { fontSize: 13, color: '#4a5878', marginTop: 4, marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#e3e8f3' },
  chipOn: { backgroundColor: '#0b1b3f' },
  chipText: { color: '#0b1b3f', fontSize: 13 },
  chipTextOn: { color: '#fff', fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  stepTitle: { fontSize: 16, fontWeight: '600', color: '#0b1b3f' },
  link: { color: '#1d4ed8', fontSize: 15, fontWeight: '600' },
  option: { borderWidth: 1, borderColor: '#d5dbe8', borderRadius: 10, padding: 12, marginBottom: 8 },
  optionOn: { borderColor: '#1d4ed8', backgroundColor: '#eef3ff' },
  optionLabel: { fontSize: 15, fontWeight: '600', color: '#0b1b3f' },
  optionDetail: { fontSize: 12, color: '#4a5878' },
  input: { borderWidth: 1, borderColor: '#c3cbdc', borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 8, backgroundColor: '#fff' },
  body: { fontSize: 15, color: '#0b1b3f', marginBottom: 8 },
  button: { backgroundColor: '#1d4ed8', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', marginTop: 4, flexGrow: 1 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  secondary: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', marginTop: 4, backgroundColor: '#e3e8f3' },
  secondaryText: { color: '#0b1b3f', fontWeight: '600', fontSize: 15 },
  disabled: { opacity: 0.4 },
  warning: { backgroundColor: '#fff6e5', borderRadius: 10, padding: 12, marginBottom: 8 },
  good: { color: '#15803d' },
  bad: { color: '#b91c1c' },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 11, color: '#4a5878' },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e3e8f3', gap: 8 },
  fieldPath: { fontSize: 12, color: '#4a5878', flexShrink: 1 },
  fieldValue: { fontSize: 12, color: '#0b1b3f', fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  missing: { color: '#c2410c' },
});
