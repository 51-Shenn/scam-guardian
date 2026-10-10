import { useRef } from 'react';

/**
 * Content-free signals from the account field. Android's TextInput has no paste event, so only the
 * field's Paste button counts as a verified paste there. A touch on the field marks its focus as the user's.
 */
export function useFieldSignals() {
  const touchedAt = useRef(0);
  return {
    attach: undefined,
    onPressIn: () => { touchedAt.current = Date.now(); },
    /** True once if a verified paste produced the next change. */
    takePaste: () => false,
    /** True if a touch on the field came just before its focus. */
    takeTouch: () => Date.now() - touchedAt.current < 500,
  };
}
