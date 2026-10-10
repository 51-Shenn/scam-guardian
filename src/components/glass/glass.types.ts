import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface GlassProps {
  /** frost: white, for controls on a light surface. sheet: denser frost, for text over a busy screen. clear: see-through, for a coloured field. dark: for a dark field. */
  tone?: 'frost' | 'sheet' | 'clear' | 'dark';
  /** Corner radius in px. A prop rather than a class so the native gradient can match it. */
  radius?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}
