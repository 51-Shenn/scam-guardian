import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { WalletButton } from './button';
import { CaretLeftIcon, LifebuoyIcon, LightbulbIcon } from './icons';
import { W } from './palette';
import { useSession } from './session';

export function StepHeader({ title, progress, top }: { title: string; progress: 1 | 2 | 3; top: number }) {
  const { dispatch } = useSession();
  return <View>
    <View className="flex-row items-center border-b border-w-line bg-white px-2.5 pb-2.5" style={{ paddingTop: top + 2 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => dispatch({ type: 'back' })}
        className="h-11 w-11 items-center justify-center rounded-full active:bg-w-surface focus-visible:outline-2 focus-visible:outline-[#ffb300]">
        <CaretLeftIcon size={22} color={W.ink} />
      </Pressable>
      <Text accessibilityRole="header" className="mr-11 flex-1 text-center font-body text-lg text-w-ink">{title}</Text>
    </View>
    <View aria-hidden className="flex-row gap-1.5 px-5 pt-3">
      {[1, 2, 3].map((index) => <View key={index} className={`h-1 flex-1 rounded-full ${index <= progress ? 'bg-w-blue' : 'bg-w-line'}`} />)}
    </View>
  </View>;
}

/** Small amber label for a demo signal or a new recipient. */
export function Tag({ label, icon }: { label: string; icon?: ReactNode }) {
  return <View className="flex-row items-center gap-1 self-start rounded-[10px] bg-w-amber-bg px-2 py-[3px]">
    {icon}<Text className="font-body text-[13px] text-w-amber">{label}</Text>
  </View>;
}

/** Simple mode: one instruction for the current step. */
export function Guide({ children }: { children: string }) {
  return <View className="flex-row gap-3 rounded-2xl bg-w-tint px-4 py-3.5">
    <LightbulbIcon size={24} color={W.deep} />
    <Text className="flex-1 font-body text-[17px] leading-6 text-w-deep">{children}</Text>
  </View>;
}

export function StepFooter({ label, onPress, disabled, bottom }: { label: string; onPress: () => void; disabled?: boolean; bottom: number }) {
  const { view, dispatch } = useSession();
  return <View className="gap-2 bg-w-surface px-5 pt-2.5" style={{ paddingBottom: bottom + 10 }}>
    <WalletButton label={label} onPress={onPress} disabled={disabled} large={view.simple} />
    <View className="flex-row justify-between">
      <WalletButton variant="quiet" large={view.simple} label="Help me with this step" icon={<LifebuoyIcon size={18} color={W.deep} />} onPress={() => dispatch({ type: 'help' })} />
      <WalletButton variant="quiet" large={view.simple} label="Cancel" onPress={() => dispatch({ type: 'cancel' })} />
    </View>
  </View>;
}
