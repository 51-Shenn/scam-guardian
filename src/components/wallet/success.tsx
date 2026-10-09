import { Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { money, recipients } from '@/domain/session';
import { WalletButton } from './button';
import { CheckCircleIcon } from './icons';
import { W } from './palette';
import { useSession } from './session';

export function Success({ top, bottom }: { top: number; bottom: number }) {
  const { session, dispatch } = useSession();
  return <View className="flex-1 bg-w-surface">
    <View className="flex-1 items-center justify-center gap-3 px-7" style={{ paddingTop: top }}>
      <Animated.View entering={ZoomIn.duration(450)}><CheckCircleIcon size={84} color={W.green} weight="fill" /></Animated.View>
      <Text accessibilityRole="header" className="text-center font-body text-[26px] text-w-ink">Demo transfer complete</Text>
      <Text className="text-center font-body text-base leading-6 text-w-muted">{money(session.amount)} to {recipients[session.to].name}. Your mock balance is now {money(session.balance)}. No real funds were sent.</Text>
    </View>
    <View className="px-5 pt-2.5" style={{ paddingBottom: bottom + 10 }}><WalletButton label="Done" onPress={() => dispatch({ type: 'done' })} /></View>
  </View>;
}
