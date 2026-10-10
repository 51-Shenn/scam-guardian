import { useCallback, useRef } from 'react';

/**
 * Content-free signals from the account field. The browser's paste event marks the next change as a
 * verified paste; the pasted text itself is never read. A pointer press marks the next focus as the user's.
 */
export function useFieldSignals() {
  const pasted = useRef(false);
  const touchedAt = useRef(0);
  const attach = useCallback((node: unknown) => {
    const element = node as HTMLElement | null;
    if (!element?.addEventListener) return;
    element.addEventListener('paste', () => { pasted.current = true; });
    element.addEventListener('pointerdown', () => { touchedAt.current = Date.now(); });
  }, []);
  return {
    attach,
    onPressIn: () => { touchedAt.current = Date.now(); },
    takePaste: () => {
      const was = pasted.current;
      pasted.current = false;
      return was;
    },
    takeTouch: () => Date.now() - touchedAt.current < 500,
  };
}
