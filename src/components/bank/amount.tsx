import { Pressable, ScrollView, Text, View } from 'react-native';
import { Glass } from '@/components/glass/glass';
import { money, recipients } from '@/domain/session';
import { Keypad } from './keypad';
import { useSession } from './session';
import { Guide, StepFooter, StepHeader, Tag } from './step-chrome';
import { useAmountKeys } from './use-amount-keys';
import { AuthoredRequest } from './authored-request';

export function AmountStep({ top, bottom, keys }: { top: number; bottom: number; keys: boolean }) {
  const { session, view, dispatch } = useSession();
  const onKey = (key: string) => dispatch({ type: 'key', key });
  useAmountKeys(keys ? onKey : null);
  const person = recipients[session.to];
  return <View className="flex-1">
    <StepHeader title="Transfer" progress={2} top={top} />
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="gap-3 pb-3 pt-[18px]">
      <View className="px-5"><AuthoredRequest /></View>
      {view.simple && <View className="px-5"><Guide>Enter the amount in ringgit. Then press Review.</Guide></View>}
      <View className="items-center px-5 pt-2.5">
        <View className="flex-row items-center gap-2">
          <Text className="font-body text-[15px] text-b-muted">To {person.name}</Text>
          {person.fresh && <Tag label="New" />}
        </View>
        <View accessible accessibilityLabel={`Amount, ${money(session.amount)}`} aria-live="polite" className="flex-row items-baseline gap-1.5">
          <Text className="font-body text-2xl text-b-muted">RM</Text>
          <Text className="font-body text-[52px] leading-[60px] tracking-[-1.5px] text-b-ink" style={{ fontVariant: ['tabular-nums'] }}>{session.amount || '0'}</Text>
        </View>
        <Text className="font-body text-sm text-b-muted">Available {money(session.balance)}</Text>
      </View>
      <Text accessibilityRole="alert" className="min-h-[21px] px-5 text-center font-body text-[15px] text-[#a1260d]">{session.error ?? ''}</Text>
      {!view.large && <View className="flex-row justify-center gap-2">
        {['50', '200', '1200'].map((amount) => <Pressable key={amount} accessibilityRole="button" onPress={() => dispatch({ type: 'setAmount', amount })}
          className="rounded-full active:opacity-70 focus-visible:outline-2 focus-visible:outline-accent">
          <Glass radius={20} className="h-10 justify-center px-4"><Text className="font-body text-[15px] text-b-ink">{money(amount).slice(0, -3)}</Text></Glass>
        </Pressable>)}
      </View>}
      <Keypad onKey={onKey} large={view.large} />
    </ScrollView>
    <StepFooter label="Review" onPress={() => dispatch({ type: 'review', now: Date.now() })} bottom={bottom} />
  </View>;
}
