import { useWindowDimensions } from 'react-native';
import type { Viewport } from '@/constants/layout';

export function useViewport(): Viewport | null {
  const { width, height } = useWindowDimensions();
  return { width, height };
}
