import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

interface BankButtonProps {
  label: string;
  onPress: () => void;
  /** primary: filled red. line: white with a border. quiet: text only. */
  variant?: 'primary' | 'line' | 'quiet';
  disabled?: boolean;
  /** Marks the chosen one of a pair of line buttons. */
  selected?: boolean;
  /** Simple mode size. */
  large?: boolean;
  icon?: ReactNode;
}

const tone = { primary: 'bg-b-red', line: 'border bg-white/80', quiet: '' };
const ink = { primary: 'text-white', line: 'text-b-ink', quiet: 'text-b-ink' };

export function BankButton({ label, onPress, variant = 'primary', disabled, selected, large, icon }: BankButtonProps) {
  const height = variant === 'quiet' ? (large ? 'h-[52px]' : 'h-[46px]') : large ? 'h-16' : 'h-[54px]';
  const size = variant === 'quiet' ? (large ? 'text-[17px]' : 'text-[15px]') : large ? 'text-xl' : 'text-[17px]';
  const edge = variant !== 'line' ? '' : selected ? 'border-b-red' : 'border-[#d9cdd0]';
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled, selected }} disabled={disabled} onPress={onPress}
    className={`flex-row items-center justify-center gap-2 rounded-full px-3 active:scale-[0.975] active:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${height} ${tone[variant]} ${edge} ${disabled ? 'opacity-45' : ''}`}>
    {icon}<Text className={`font-body ${size} ${ink[variant]}`}>{label}</Text>
  </Pressable>;
}
