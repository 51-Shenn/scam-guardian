import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, SlideInDown } from 'react-native-reanimated';
import { Glass } from '@/components/glass/glass';

interface SheetProps {
  label: string;
  bottom: number;
  /** Omit to make the scrim inert: the pause sheet must be answered with one of its buttons. */
  onDismiss?: () => void;
  children: ReactNode;
}

/** A glass panel that floats just inside the screen edges. */
export function Sheet({ label, bottom, onDismiss, children }: SheetProps) {
  return <View className="absolute inset-0 z-10 justify-end">
    <Animated.View entering={FadeIn.duration(250)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20, 16, 28, 0.42)' }]}>
      {onDismiss && <Pressable className="flex-1" onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Close" />}
    </Animated.View>
    <Animated.View entering={SlideInDown.duration(450).easing(Easing.bezier(0.16, 1, 0.3, 1))} role="dialog" aria-modal aria-label={label}
      style={{ maxHeight: '88%', marginHorizontal: 8, marginBottom: Math.max(bottom, 8) }}>
      <Glass tone="sheet" radius={34} className="shrink px-5 pb-4 pt-3">
        <View className="mb-3.5 h-[5px] w-10 self-center rounded-full bg-[#c9cdd8]" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3.5">{children}</ScrollView>
      </Glass>
    </Animated.View>
  </View>;
}
