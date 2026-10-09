import { Pressable, ScrollView, Text, View } from 'react-native';
import { money, recipients } from '@/domain/session';
import { Keypad } from './keypad';
import { useSession } from './session';
import { Guide, StepFooter, StepHeader, Tag } from './step-chrome';
import { useAmountKeys } from './use-amount-keys';

export function AmountStep({ top, bottom, keys }: { top: number; bottom: number; keys: boolean }) {
  const { session, view, dispatch } = useSession();
  const onKey = (key: string) => dispatch({ type: 'key', key });
  useAmountKeys(keys ? onKey : null);
  const person = recipients[session.to];
  return <View className="flex-1">
    <StepHeader title="Transfer" progress={2} top={top} />
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="gap-3 pb-3 pt-[18px]">
      {view.simple && <View className="px-5"><Guide>Enter the amount in ringgit. Then press Review.</Guide></View>}
      <View className="items-center px-5 pt-2.5">
        <View className="flex-row items-center gap-2">
          <Text className="font-body text-[15px] text-w-muted">To {person.name}</Text>
          {person.fresh && <Tag label="New" />}
        </View>
        <View accessible accessibilityLabel={`Amount, ${money(session.amount)}`} aria-live="polite" className="flex-row items-baseline gap-1.5">
          <Text className="font-body text-2xl text-w-muted">RM</Text>
          <Text className="font-body text-[52px] leading-[60px] tracking-[-1.5px] text-w-ink" style={{ fontVariant: ['tabular-nums'] }}>{session.amount || '0'}</Text>
        </View>
        <Text className="font-body text-sm text-w-muted">Available {money(session.balance)}</Text>
      </View>
      <Text accessibilityRole="alert" className="min-h-[21px] px-5 text-center font-body text-[15px] text-[#a1260d]">{session.error ?? ''}</Text>
      {!view.simple && <View className="flex-row justify-center gap-2">
        {['10', '50', '100'].map((amount) => <Pressable key={amount} accessibilityRole="button" onPress={() => dispatch({ type: 'setAmount', amount })}
          className="h-10 justify-center rounded-full border border-w-line bg-white px-4 active:bg-w-tint focus-visible:outline-2 focus-visible:outline-[#ffb300]">
          <Text className="font-body text-[15px] text-w-ink">RM {amount}</Text>
        </Pressable>)}
      </View>}
      <Keypad onKey={onKey} large={view.simple} />
    </ScrollView>
    <StepFooter label="Review" onPress={() => dispatch({ type: 'review', now: Date.now() })} bottom={bottom} />
  </View>;
}
