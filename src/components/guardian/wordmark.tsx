import { Image } from 'expo-image';
import { Pressable, Text } from 'react-native';

export function Wordmark({ onPress }: { onPress: () => void }) {
  return <Pressable accessibilityRole="link" accessibilityLabel="Scam Guardian, home" onPress={onPress}
    className="flex-row items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
    <Image source={require('@/assets/guardian/logo.svg')} style={{ width: 26, height: 30 }} contentFit="contain" accessible={false} />
    <Text className="font-display text-[23px] tracking-[-0.2px] text-ink">Scam Guardian</Text>
  </Pressable>;
}
