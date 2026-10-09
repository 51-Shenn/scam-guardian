import { Pressable, Text } from 'react-native';
import type { ActionProps } from './action.types';

// A plain pressable rather than a Material button: Material derives its own tone from a seed colour,
// so it cannot show the exact cobalt accent the web button uses.
export function Action({ label, onPress, secondary, disabled, large, small }: ActionProps) {
  const size = small ? 'h-11 px-[18px]' : large ? 'h-16 px-7' : 'h-[52px] px-[26px]';
  const text = small ? 'text-[15px]' : large ? 'text-lg' : 'text-base';
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    className={`items-center justify-center rounded-full active:scale-[0.97] active:opacity-90 ${size} ${secondary ? 'border border-border bg-white/70' : 'bg-accent'} ${disabled ? 'opacity-50' : ''}`}>
    <Text className={`font-body ${text} ${secondary ? 'text-ink' : 'text-white'}`}>{label}</Text>
  </Pressable>;
}
