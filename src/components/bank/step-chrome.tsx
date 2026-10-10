import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Glass } from '@/components/glass/glass';
import { BankButton } from './button';
import { CaretLeftIcon, LifebuoyIcon, LightbulbIcon } from './icons';
import { B } from './palette';
import { useSession } from './session';

export function StepHeader({ title, progress, top }: { title: string; progress: 1 | 2 | 3; top: number }) {
  const { dispatch } = useSession();
  return <View className="px-3" style={{ paddingTop: top + 2 }}>
    <Glass radius={28} className="h-14 flex-row items-center px-1.5">
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => dispatch({ type: 'back' })}
        className="h-11 w-11 items-center justify-center rounded-full active:bg-b-surface focus-visible:outline-2 focus-visible:outline-accent">
        <CaretLeftIcon size={22} color={B.ink} />
      </Pressable>
      <Text accessibilityRole="header" className="flex-1 text-center font-body text-lg text-b-ink">{title}</Text>
      <Text accessibilityLabel={`Step ${progress} of 3`} className="w-11 text-center font-body text-sm text-b-muted" style={{ fontVariant: ['tabular-nums'] }}>{progress}/3</Text>
    </Glass>
    <View aria-hidden className="flex-row gap-1.5 px-2 pt-3">
      {[1, 2, 3].map((index) => <View key={index} className={`h-1 flex-1 rounded-full ${index <= progress ? 'bg-b-red' : 'bg-[#d9dce5]'}`} />)}
    </View>
  </View>;
}

/** Small amber label for a demo signal or a new recipient. */
export function Tag({ label, icon }: { label: string; icon?: ReactNode }) {
  return <View className="flex-row items-center gap-1 self-start rounded-[10px] bg-b-amber-bg px-2 py-[3px]">
    {icon}<Text className="font-body text-[13px] text-b-amber">{label}</Text>
  </View>;
}

/** Simple mode: one instruction for the current step. */
export function Guide({ children }: { children: string }) {
  return <View className="flex-row gap-3 rounded-[20px] bg-b-tint px-4 py-3.5">
    <LightbulbIcon size={24} color={B.red} />
    <Text className="flex-1 font-body text-[17px] leading-6 text-[#6d0a1b]">{children}</Text>
  </View>;
}

export function StepFooter({ label, onPress, disabled, bottom }: { label: string; onPress: () => void; disabled?: boolean; bottom: number }) {
  const { view, dispatch } = useSession();
  return <View className="gap-2 px-5 pt-2.5" style={{ paddingBottom: bottom + 10 }}>
    <BankButton label={label} onPress={onPress} disabled={disabled} large={view.large} />
    <View className="flex-row justify-between">
      <BankButton variant="quiet" large={view.large} label="Help me with this step" icon={<LifebuoyIcon size={18} color={B.red} />} onPress={() => dispatch({ type: 'help' })} />
      <BankButton variant="quiet" large={view.large} label="Cancel" onPress={() => dispatch({ type: 'cancel' })} />
    </View>
  </View>;
}
