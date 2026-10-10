import { View } from 'react-native';
import type { GlassProps } from './glass.types';

/** Frosted glass through CSS backdrop-filter. The tones live in global.css. */
export function Glass({ tone = 'frost', radius = 24, className = '', style, children }: GlassProps) {
  return <View className={`glass glass-${tone} ${className}`} style={[{ borderRadius: radius }, style]}>{children}</View>;
}
