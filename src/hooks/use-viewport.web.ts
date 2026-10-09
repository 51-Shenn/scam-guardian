import { useSyncExternalStore } from 'react';
import type { Viewport } from '@/constants/layout';

function subscribe(callback: () => void) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}
const read = () => `${window.innerWidth}x${window.innerHeight}`;

/** Null until hydrated, so server and first client render agree. */
export function useViewport(): Viewport | null {
  const size = useSyncExternalStore(subscribe, read, () => null);
  if (!size) return null;
  const [width, height] = size.split('x').map(Number);
  return { width, height };
}
