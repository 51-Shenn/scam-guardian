import { ScrollView, Text, View } from 'react-native';
import { money, recipients } from '@/domain/session';
import { PauseRing } from './pause-ring';
import { useSession } from './session';
import { Guide, StepFooter, StepHeader } from './step-chrome';

export function ReviewStep({ top, bottom }: { top: number; bottom: number }) {
  const { session, view, dispatch } = useSession();
  const size = view.simple ? 'text-[19px]' : 'text-base';
  const rows: [string, string][] = [['To', recipients[session.to].name], ['Amount', money(session.amount)], ['Fee', 'RM 0.00'], ['From', 'Demo balance']];
  return <View className="flex-1">
    <StepHeader title="Review" progress={3} top={top} />
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="gap-3.5 px-5 pb-3 pt-[18px]">
      {view.simple && <Guide>Check the person and the amount. Confirm only when both are right.</Guide>}
      <Text accessibilityRole="header" className={`font-body text-w-ink ${view.simple ? 'text-[28px] leading-[34px]' : 'text-2xl'}`}>{view.paused ? 'Take a moment' : 'Check your transfer'}</Text>
      <View className="rounded-[18px] bg-white px-4 py-1">
        {rows.map(([label, value], index) => <View key={label} className={`flex-row items-center justify-between gap-4 py-[13px] ${index ? 'border-t border-w-line' : ''}`}>
          <Text className={`font-body text-w-muted ${size}`}>{label}</Text>
          <Text className={`font-body text-w-ink ${label === 'Amount' ? 'text-[22px]' : size}`}>{value}</Text>
        </View>)}
      </View>
      {view.paused && <View className="flex-row items-center gap-4 rounded-[20px] bg-w-amber-bg p-4">
        <PauseRing fraction={view.fraction} seconds={view.remaining} />
        <Text aria-live="polite" className="flex-1 font-body text-[17px] leading-[23px] text-[#4f2b00]">{view.locked ? 'A short pause before you decide.' : 'The pause has ended. The choice is yours.'}</Text>
      </View>}
    </ScrollView>
    <StepFooter label={view.paused ? 'Continue with transfer' : 'Confirm transfer'} disabled={view.locked} onPress={() => dispatch({ type: 'confirm', now: Date.now() })} bottom={bottom} />
  </View>;
}
