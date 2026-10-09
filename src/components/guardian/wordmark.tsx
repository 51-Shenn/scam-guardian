import { Pressable, Text } from 'react-native';
import { ShieldCheckIcon } from '@/components/wallet/icons';

export function Wordmark({ onPress }: { onPress: () => void }) {
  return <Pressable accessibilityRole="link" accessibilityLabel="Scam Guardian, home" onPress={onPress}
    className="flex-row items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
    <ShieldCheckIcon size={26} color="#1447e6" weight="fill" />
    <Text className="font-display text-[23px] tracking-[-0.2px] text-ink">Scam Guardian</Text>
  </Pressable>;
}
