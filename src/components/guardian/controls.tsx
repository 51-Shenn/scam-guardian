import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Icon } from '@/components/bank/icons';
import { caption } from './text';

// Everything that can be pressed in the console is a white, bordered, slightly raised tile. What only reports has no box at all.
const raised = { boxShadow: '0 1px 2px rgba(34, 20, 26, 0.16)' };
const tile = 'flex-row items-center justify-center gap-1.5 rounded-xl border active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const INK = '#22141a';
const SOFT = '#66575d';

/** The name of a group, with its icon and an optional note at the far end. */
export function Label({ icon: Glyph, children, note }: { icon: Icon; children: string; note?: ReactNode }) {
  return <View className="flex-row flex-wrap items-center justify-between gap-x-2">
    <View className="flex-row items-center gap-1.5">
      <Glyph size={16} color={SOFT} />
      <Text className="font-body text-[15px] leading-5 text-ink">{children}</Text>
    </View>
    {typeof note === 'string' ? <Text className={caption}>{note}</Text> : note}
  </View>;
}

interface Option<T> { value: T; label: string; accessibilityLabel?: string; mark?: (on: boolean) => ReactNode }
interface SegmentedProps<T> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Mouse-sized tiles for the wide stage. Otherwise every choice is a full touch target. */
  dense?: boolean;
}

/** One choice from a short row of tiles. The chosen one is filled. */
export function Segmented<T extends string | null>({ options, value, onChange, disabled, dense }: SegmentedProps<T>) {
  return <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-1">
    {options.map((option) => {
      const on = option.value === value;
      // The web build takes the chosen state from aria-checked; Android takes it from the accessibility state.
      return <Pressable key={option.value ?? 'none'} accessibilityRole="radio" accessibilityLabel={option.accessibilityLabel}
        aria-checked={on} accessibilityState={{ checked: on, disabled }} disabled={disabled} onPress={() => onChange(option.value)} style={on || disabled ? undefined : raised}
        className={`${tile} grow ${dense ? 'h-9 px-1.5' : 'min-h-11 px-3'} ${on ? 'border-ink bg-ink' : 'border-border bg-white'} ${disabled && !on ? 'opacity-45' : ''}`}>
        {option.mark?.(on)}
        <Text className={`font-body text-sm ${on ? 'text-white' : 'text-ink'}`}>{option.label}</Text>
      </Pressable>;
    })}
  </View>;
}

interface ButtonProps {
  label: string;
  icon: Icon;
  onPress: () => void;
  disabled?: boolean;
  /** The one action the current step is waiting for. */
  primary?: boolean;
  dense?: boolean;
  accessibilityLabel?: string;
}

/** An action in the console: an icon, a verb, and the same raised tile as the choices. */
export function Button({ label, icon: Glyph, onPress, disabled, primary, dense, accessibilityLabel }: ButtonProps) {
  const filled = primary && !disabled;
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={disabled ? undefined : raised}
    className={`${tile} grow ${dense ? 'h-9 px-2.5' : 'min-h-11 px-3.5'} ${filled ? 'border-accent bg-accent' : 'border-border bg-white'} ${disabled ? 'opacity-45' : ''}`}>
    <Glyph size={16} color={filled ? '#ffffff' : INK} />
    <Text className={`font-body text-sm ${filled ? 'text-white' : 'text-ink'}`}>{label}</Text>
  </Pressable>;
}
