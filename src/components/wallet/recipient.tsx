import { Pressable, ScrollView, Text, View } from 'react-native';
import { recipientIds, recipients } from '@/domain/session';
import { CheckCircleIcon, ClipboardTextIcon, UserPlusIcon } from './icons';
import { W } from './palette';
import { useSession } from './session';
import { Guide, StepFooter, StepHeader, Tag } from './step-chrome';

export function RecipientStep({ top, bottom }: { top: number; bottom: number }) {
  const { session, view, dispatch } = useSession();
  return <View className="flex-1">
    <StepHeader title="Transfer" progress={1} top={top} />
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="gap-3.5 px-5 pb-3 pt-[18px]">
      {view.simple && <Guide>Choose the person you want to send to. Then press Next.</Guide>}
      <Text accessibilityRole="header" className={`font-body text-w-ink ${view.simple ? 'text-[28px] leading-[34px]' : 'text-2xl'}`}>Who are you sending to?</Text>
      {!view.simple && <Text className="font-body text-[15px] text-w-muted">Pick a saved contact or a new recipient.</Text>}
      <View accessibilityRole="radiogroup" className="gap-3.5">
        {recipientIds.map((id) => {
          const person = recipients[id];
          const selected = session.to === id;
          return <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => dispatch({ type: 'pick', to: id })}
            className={`flex-row items-center gap-3.5 rounded-2xl border-2 bg-white active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-[#ffb300] ${view.simple ? 'p-4' : 'px-3.5 py-3'} ${selected ? 'border-w-blue' : 'border-transparent'}`}>
            <View aria-hidden className={`h-[46px] w-[46px] items-center justify-center rounded-full ${person.fresh ? 'bg-w-amber-bg' : 'bg-w-tint'}`}>
              {person.fresh ? <UserPlusIcon size={22} color={W.amber} /> : <Text className="font-body text-[19px] text-w-blue">{person.initial}</Text>}
            </View>
            <View className="flex-1 gap-0.5">
              <Text className={`font-body text-w-ink ${view.simple ? 'text-[21px]' : 'text-[17px]'}`}>{person.name}</Text>
              <Text className={`font-body text-w-muted ${view.simple ? 'text-base' : 'text-sm'}`}>{person.meta}</Text>
              {person.fresh && view.fixture.paste && <Tag label="Pasted, simulated" icon={<ClipboardTextIcon size={14} color={W.amber} />} />}
            </View>
            {selected && <CheckCircleIcon size={24} color={W.blue} weight="fill" />}
          </Pressable>;
        })}
      </View>
    </ScrollView>
    <StepFooter label="Next" onPress={() => dispatch({ type: 'next' })} bottom={bottom} />
  </View>;
}
