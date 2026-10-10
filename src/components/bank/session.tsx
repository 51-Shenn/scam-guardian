import { createContext, use, useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { createGuardian, type Guardian } from '@/domain/guardian';
import { createLocalDemoApi } from '@/domain/local-api';
import { loadModelBundle } from '@/domain/model-bundle';
import { derive, initialSession, reduce, type Action, type Derived, type Session } from '@/domain/session';
import { useWindowFocus } from './use-window-focus';

interface SessionValue { session: Session; view: Derived; dispatch: (action: Action) => void; guardian: Guardian }
const SessionContext = createContext<SessionValue | null>(null);

const newId = () => `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** One on-device guardian per app run. Events, features and predictions stay in memory on this device. */
function makeGuardian(): Guardian {
  const api = createLocalDemoApi({
    clock: () => performance.now(),
    loadBundle: loadModelBundle,
    // Web sees real paste events; Android counts pastes made with the field's Paste button.
    availability: { editing: true, explicitPaste: true },
  });
  return createGuardian({
    api,
    platform: Platform.OS === 'web' ? 'web' : Platform.OS === 'ios' ? 'ios' : 'android',
    appBuild: process.env.EXPO_PUBLIC_APP_BUILD || 'dev',
    // An opaque key for this run of the app. No name, phone or account number.
    localUserKey: `local-${Math.random().toString(36).slice(2, 12)}`,
    newId,
  });
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, baseDispatch] = useReducer(reduce, initialSession);
  const [now, setNow] = useState(() => Date.now());
  const [guardian] = useState(makeGuardian);
  // Every state change goes through dispatch below, so this ref always holds the state the next action applies to.
  const current = useRef(initialSession);

  // Every action is also shown to the guardian, which turns it into content-free contract events.
  const dispatch = useCallback((action: Action) => {
    const prev = current.current;
    const next = reduce(prev, action);
    guardian.observe(action, prev, next);
    current.current = next;
    baseDispatch(action);
  }, [guardian]);

  const { step, deadline, sheet } = session;
  const monitored = guardian.sessionId !== null && (step === 'recipient' || step === 'amount' || step === 'review');

  // One timer for the whole app, running only while a pause is on screen.
  useEffect(() => {
    if (step !== 'review' || deadline === null) return;
    const timer = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= deadline) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [step, deadline]);

  // The on-device model runs on its frozen five-second grid while a monitored transfer is open.
  useEffect(() => {
    if (!monitored) return;
    let running = false;
    const timer = setInterval(() => {
      if (running) return;
      running = true;
      guardian.predictDue().then((ai) => { if (ai) dispatch({ type: 'ai', ai, now: Date.now() }); }).finally(() => { running = false; });
    }, 1000);
    return () => clearInterval(timer);
  }, [monitored, guardian, dispatch]);

  // App lifecycle while a transfer is monitored.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' || state === 'background' || state === 'inactive') guardian.lifecycle(state);
    });
    return () => subscription.remove();
  }, [guardian]);
  useWindowFocus(useCallback((focused: boolean) => guardian.windowFocus(focused), [guardian]));

  const view = derive(session, now);
  // A shown pause is logged once, with what decided it.
  useEffect(() => {
    if (sheet === 'pause' && view.origin) guardian.warn(view.origin);
  }, [sheet, view.origin, guardian]);

  return <SessionContext value={{ session, view, dispatch, guardian }}>{children}</SessionContext>;
}

export function useSession(): SessionValue {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
