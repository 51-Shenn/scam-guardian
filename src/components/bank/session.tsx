import { createContext, use, useEffect, useReducer, useState, type Dispatch, type ReactNode } from 'react';
import { derive, initialSession, reduce, type Action, type Derived, type Session } from '@/domain/session';

interface SessionValue { session: Session; view: Derived; dispatch: Dispatch<Action> }
const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, dispatch] = useReducer(reduce, initialSession);
  const [now, setNow] = useState(() => Date.now());
  const { step, deadline } = session;
  // One timer for the whole app, running only while a pause is on screen.
  useEffect(() => {
    if (step !== 'review' || deadline === null) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [step, deadline]);
  return <SessionContext value={{ session, view: derive(session, now), dispatch }}>{children}</SessionContext>;
}

export function useSession(): SessionValue {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
