import { Pressable, Text } from 'react-native';
import type { ActionProps } from './action.types';

// A plain pressable rather than a Material button: Material derives its own tone from a seed colour,
// so it cannot show the exact accent the web button uses.
// Android has no backdrop blur here, so the glass is the near-opaque frost of components/glass/glass.tsx: white, a white edge and the same soft shadow.
const frost = { boxShadow: '0 0 0 1px rgba(27, 29, 40, 0.05), 0 16px 34px -22px rgba(27, 29, 40, 0.4)' };

export function Action({ label, onPress, secondary, disabled, large, small, icon: Glyph, iconOnly, glass }: ActionProps) {
  const frosted = glass && secondary;
  const bare = !!Glyph && iconOnly;
  const size = small ? `h-11 ${bare ? 'w-11 shrink-0' : 'px-[18px]'}` : large ? `h-16 ${bare ? 'w-16 shrink-0' : 'px-7'}` : `h-[52px] ${bare ? 'w-[52px] shrink-0' : 'px-[26px]'}`;
  const text = small ? 'text-[15px]' : large ? 'text-lg' : 'text-base';
  return <Pressable accessibilityRole="button" accessibilityLabel={bare ? label : undefined} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={frosted ? frost : undefined}
    className={`flex-row items-center justify-center gap-2 rounded-full active:scale-[0.97] active:opacity-90 ${size} ${frosted ? 'border border-white/90 bg-white/95' : secondary ? 'border border-border bg-white/70' : 'bg-accent'} ${disabled ? 'opacity-50' : ''}`}>
    {Glyph && <Glyph size={small ? 18 : 20} color={secondary ? '#22141a' : '#ffffff'} />}
    {!bare && <Text className={`font-body ${text} ${secondary ? 'text-ink' : 'text-white'}`}>{label}</Text>}
  </Pressable>;
}
