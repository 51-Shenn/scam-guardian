import { Pressable, ScrollView, Text, View } from 'react-native';
import { Glass } from '@/components/glass/glass';
import { DEMO_ACCOUNT, recipientIds, recipients } from '@/domain/session';
import { BankButton } from './button';
import { CheckCircleIcon, ClipboardTextIcon, KeyboardIcon, UserPlusIcon } from './icons';
import { B } from './palette';
import { useSession } from './session';
import { Guide, StepFooter, StepHeader, Tag } from './step-chrome';

export function RecipientStep({ top, bottom }: { top: number; bottom: number }) {
  const { session, view, dispatch } = useSession();
  const { entry } = session;
  return <View className="flex-1">
    <StepHeader title="Transfer" progress={1} top={top} />
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="gap-3 px-5 pb-3 pt-[18px]">
      {view.simple && <Guide>Choose the person you want to send to. Then press Next.</Guide>}
      <Text accessibilityRole="header" className={`font-body text-b-ink ${view.simple ? 'text-[28px] leading-[34px]' : 'text-2xl'}`}>Who are you sending to?</Text>
      {!view.simple && <Text className="font-body text-[15px] text-b-muted">Pick a saved contact or a new recipient.</Text>}
      <View accessibilityRole="radiogroup" className="gap-2.5">
        {recipientIds.map((id) => {
          const person = recipients[id];
          const selected = session.to === id;
          return <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => dispatch({ type: 'pick', to: id })}
            className={`rounded-[24px] border-2 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${selected ? 'border-b-red' : 'border-transparent'}`}>
            <Glass radius={22} className={`flex-row items-center gap-3.5 ${view.simple ? 'p-4' : 'px-3.5 py-3'}`}>
              <View aria-hidden className={`h-[46px] w-[46px] items-center justify-center rounded-full ${person.fresh ? 'bg-b-amber-bg' : 'bg-b-tint'}`}>
                {person.fresh ? <UserPlusIcon size={22} color={B.amber} /> : <Text className="font-body text-[19px] text-b-red">{person.initial}</Text>}
              </View>
              <View className="flex-1 gap-0.5">
                <Text className={`font-body text-b-ink ${view.simple ? 'text-[21px]' : 'text-[17px]'}`}>{person.name}</Text>
                <Text className={`font-body text-b-muted ${view.simple ? 'text-base' : 'text-sm'}`}>{person.meta}</Text>
              </View>
              {selected && <CheckCircleIcon size={24} color={B.red} weight="fill" />}
            </Glass>
          </Pressable>;
        })}
      </View>
      {recipients[session.to].fresh && <Glass radius={22} className="gap-2.5 p-4">
        <Text className="font-body text-sm text-b-muted">Account number</Text>
        <View className="flex-row flex-wrap items-center gap-2">
          <Text aria-live="polite" className={`font-body ${entry ? 'text-[22px] tracking-[0.6px] text-b-ink' : 'text-[17px] text-b-muted'}`} style={{ fontVariant: ['tabular-nums'] }}>{entry ? DEMO_ACCOUNT : 'Not entered yet'}</Text>
          {entry === 'pasted' && <Tag label="Pasted" icon={<ClipboardTextIcon size={14} color={B.amber} />} />}
        </View>
        <View className="flex-row gap-2.5">
          <View className="flex-1"><BankButton variant="line" selected={entry === 'typed'} label="Type it" icon={<KeyboardIcon size={18} color={B.ink} />} onPress={() => dispatch({ type: 'entry', entry: 'typed' })} /></View>
          <View className="flex-1"><BankButton variant="line" selected={entry === 'pasted'} label="Paste it" icon={<ClipboardTextIcon size={18} color={B.ink} />} onPress={() => dispatch({ type: 'entry', entry: 'pasted' })} /></View>
        </View>
        <Text className="font-body text-[13px] leading-[18px] text-b-muted">Simulated entry with a made-up number. Nothing is read from your clipboard.</Text>
      </Glass>}
    </ScrollView>
    <StepFooter label="Next" disabled={!view.ready} onPress={() => dispatch({ type: 'next' })} bottom={bottom} />
  </View>;
}
