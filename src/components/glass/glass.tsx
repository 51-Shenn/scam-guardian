import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import type { GlassProps } from './glass.types';

// Android has no backdrop blur without a native blur module, so the glass is a translucent sheen.
// Frost and dark are near opaque here: text may scroll beneath them, and unblurred text would show through.
const tones = {
  frost: { colors: ['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.92)'], border: 'rgba(255, 255, 255, 0.9)', shadow: '0 0 0 1px rgba(27, 29, 40, 0.05), 0 16px 34px -22px rgba(27, 29, 40, 0.4)' },
  sheet: { colors: ['#ffffff', '#ffffff'], border: '#ffffff', shadow: '0 -10px 40px -18px rgba(27, 29, 40, 0.5)' },
  clear: { colors: ['rgba(255, 255, 255, 0.26)', 'rgba(255, 255, 255, 0.08)'], border: 'rgba(255, 255, 255, 0.34)', shadow: '0 22px 40px -26px rgba(48, 0, 10, 0.7)' },
  dark: { colors: ['rgba(30, 34, 52, 0.94)', 'rgba(16, 18, 30, 0.9)'], border: 'rgba(255, 255, 255, 0.16)', shadow: '0 18px 36px -22px rgba(0, 0, 0, 0.6)' },
} as const;

export function Glass({ tone = 'frost', radius = 24, className, style, children }: GlassProps) {
  const { colors, border, shadow } = tones[tone];
  return <View className={className} style={[{ borderRadius: radius, borderWidth: 1, borderColor: border, boxShadow: shadow }, style]}>
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: radius - 1 }]} />
    {children}
  </View>;
}
