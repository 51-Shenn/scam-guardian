import { useEffect } from 'react';
import { useIsFocused } from 'expo-router';

/** Lets a physical keyboard drive the keypad. Pass null to stay inert, as the tap-through preview does. */
export function useAmountKeys(onKey: ((key: string) => void) | null) {
  const focused = useIsFocused();
  useEffect(() => {
    if (!onKey || !focused) return;
    const listen = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Backspace') onKey('del');
      else if (/^[\d.]$/.test(event.key)) onKey(event.key);
    };
    document.addEventListener('keydown', listen);
    return () => document.removeEventListener('keydown', listen);
  }, [onKey, focused]);
}
