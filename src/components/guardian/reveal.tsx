import type { ReactNode } from 'react';
import { View } from 'react-native';

/** Scroll reveal is a web nicety. On Android content is simply there. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={className}>{children}</View>;
}
