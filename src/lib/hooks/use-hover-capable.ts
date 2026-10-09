import { useSyncExternalStore } from 'react';
const query = '(hover: hover) and (pointer: fine)';
function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
export function useHoverCapable() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
