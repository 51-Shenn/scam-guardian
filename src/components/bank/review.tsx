import { ScrollView, Text, View } from 'react-native';
import { Glass } from '@/components/glass/glass';
import { groupDigits, money, recipients } from '@/domain/session';
import { PauseRing } from './pause-ring';
import { useSession } from './session';
import { Guide, StepFooter, StepHeader } from './step-chrome';

export function ReviewStep({ top, bottom }: { top: number; bottom: number }) {
  const { session, view, dispatch, guardian } = useSession();
  const size = view.simple ? 'text-[19px]' : 'text-base';
  const person = recipients[session.to];
  const account: [string, string][] = person.fresh ? [['Account', groupDigits(session.account)]] : [];
  const confirm = () => {
    if (view.paused && !view.locked) guardian.verify('continue');
    dispatch({ type: 'confirm', now: Date.now() });
  };
  const rows: [string, string][] = [['To', person.name], ...account, ['Amount', money(session.amount)], ['Fee', 'RM 0.00'], ['From', 'Demo savings account']];
  return <View className="flex-1">
    <StepHeader title="Review" progress={3} top={top} />
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="gap-3.5 px-5 pb-3 pt-[18px]">
      {view.simple && <Guide>Check the person and the amount. Confirm only when both are right.</Guide>}
      <Text accessibilityRole="header" className={`font-body text-b-ink ${view.simple ? 'text-[28px] leading-[34px]' : 'text-2xl'}`}>{view.paused ? 'Take a moment' : 'Check before you send'}</Text>
      <Glass radius={22} className="px-4 py-1">
        {rows.map(([label, value], index) => <View key={label} className={`flex-row items-center justify-between gap-4 py-[13px] ${index ? 'border-t border-b-line' : ''}`}>
          <Text className={`font-body text-b-muted ${size}`}>{label}</Text>
          <Text className={`font-body text-b-ink ${label === 'Amount' ? 'text-[22px]' : size}`} style={{ fontVariant: ['tabular-nums'] }}>{value}</Text>
        </View>)}
      </Glass>
      {view.paused && <View className="flex-row items-center gap-4 rounded-[22px] bg-b-amber-bg p-4">
        <PauseRing fraction={view.fraction} seconds={view.remaining} />
        <Text aria-live="polite" className="flex-1 font-body text-[17px] leading-[23px] text-[#4f2b00]">{view.locked ? 'A short pause before you decide.' : 'The pause has ended. The choice is yours.'}</Text>
      </View>}
    </ScrollView>
    <StepFooter label={view.paused ? 'Continue with transfer' : 'Confirm transfer'} disabled={view.locked} onPress={confirm} bottom={bottom} />
  </View>;
}
