import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BankButton } from './button';
import { AppWindowIcon } from './icons';
import { B } from './palette';
import { useSession } from './session';

const block = 'rounded-full bg-[#dde0e7]';
const lines = ['w-3/4', 'w-1/2', 'w-2/3', 'w-2/5'];

/** Stands in for whatever is opened after leaving the bank app. It is blank on purpose: Guardian never knows which app it is. */
export function OtherApp({ top, bottom }: { top: number; bottom: number }) {
  const { dispatch } = useSession();
  return <Animated.View entering={FadeIn.duration(250)} style={{ flex: 1 }}>
    <View className="flex-1 bg-[#eef0f4] px-5" style={{ paddingTop: top + 14, paddingBottom: bottom + 12 }}>
      <View aria-hidden className="gap-5">
        <View className="flex-row items-center gap-3">
          <View className={`h-11 w-11 ${block}`} />
          <View className="flex-1 gap-2"><View className={`h-3 w-2/5 ${block}`} /><View className={`h-3 w-1/4 ${block}`} /></View>
        </View>
        {lines.map((width) => <View key={width} className={`h-3 ${width} ${block}`} />)}
      </View>
      <View className="flex-1 items-center justify-center gap-2">
        <AppWindowIcon size={34} color={B.muted} />
        <Text accessibilityRole="header" className="font-body text-xl text-b-ink">Another app</Text>
        <Text className="max-w-[290px] text-center font-body text-[15px] leading-[22px] text-b-muted">Simulated. Guardian counts that the bank app was left, never what was opened.</Text>
      </View>
      <BankButton variant="line" label="Return to bank app" onPress={() => dispatch({ type: 'toggleAway' })} />
    </View>
  </Animated.View>;
}
