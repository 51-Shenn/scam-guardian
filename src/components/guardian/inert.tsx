import type { ReactNode } from 'react';
import { View } from 'react-native';

/** Shows its children as a picture: no touches reach them and assistive technology skips them. */
export function Inert({ children }: { children: ReactNode }) {
  return <View aria-hidden style={{ pointerEvents: 'none' }}>{children}</View>;
}
