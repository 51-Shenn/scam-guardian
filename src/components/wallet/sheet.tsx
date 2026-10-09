import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, SlideInDown } from 'react-native-reanimated';

interface SheetProps {
  label: string;
  bottom: number;
  /** Omit to make the scrim inert: the pause sheet must be answered with one of its buttons. */
  onDismiss?: () => void;
  children: ReactNode;
}

export function Sheet({ label, bottom, onDismiss, children }: SheetProps) {
  return <View className="absolute inset-0 z-10 justify-end">
    <Animated.View entering={FadeIn.duration(250)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8, 20, 43, 0.45)' }]}>
      {onDismiss && <Pressable className="flex-1" onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Close" />}
    </Animated.View>
    <Animated.View entering={SlideInDown.duration(450).easing(Easing.bezier(0.16, 1, 0.3, 1))} role="dialog" aria-modal aria-label={label}
      style={{ maxHeight: '86%', borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#ffffff', paddingHorizontal: 22, paddingTop: 12, paddingBottom: bottom + 14 }}>
      <View className="mb-3.5 h-[5px] w-10 self-center rounded-full bg-[#d5dbe6]" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3.5">{children}</ScrollView>
    </Animated.View>
  </View>;
}
