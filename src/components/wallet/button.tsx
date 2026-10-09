import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

interface WalletButtonProps {
  label: string;
  onPress: () => void;
  /** primary: filled blue. line: white with a border. quiet: text only. */
  variant?: 'primary' | 'line' | 'quiet';
  disabled?: boolean;
  /** Simple mode size. */
  large?: boolean;
  icon?: ReactNode;
}

const tone = { primary: 'bg-w-blue', line: 'border border-[#c9d2e0] bg-white', quiet: '' };
const ink = { primary: 'text-white', line: 'text-w-ink', quiet: 'text-w-deep' };

export function WalletButton({ label, onPress, variant = 'primary', disabled, large, icon }: WalletButtonProps) {
  const height = variant === 'quiet' ? (large ? 'h-[52px]' : 'h-[46px]') : large ? 'h-16' : 'h-[54px]';
  const size = variant === 'quiet' ? (large ? 'text-[17px]' : 'text-[15px]') : large ? 'text-xl' : 'text-[17px]';
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    className={`flex-row items-center justify-center gap-2 rounded-full px-3 active:scale-[0.975] active:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb300] ${height} ${tone[variant]} ${disabled ? 'opacity-45' : ''}`}>
    {icon}<Text className={`font-body ${size} ${ink[variant]}`}>{label}</Text>
  </Pressable>;
}
