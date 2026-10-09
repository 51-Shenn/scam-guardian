import { Image } from 'expo-image';
import { View } from 'react-native';

/** The Android figure is a still, so there is nothing to point at. */
export const LOCK_HINT = '';

// The Hairline engine is DOM-based. Android shows its rest pose, captured from design/hairline-locks.html.
export function LockFigure() {
  return <View className="overflow-hidden rounded-3xl border border-line bg-white">
    <Image source={require('@/assets/guardian/locks.png')} style={{ width: '100%', aspectRatio: 672 / 548 }} contentFit="contain"
      accessibilityLabel="Line drawing of three canal locks with one gate partly open" />
  </View>;
}
