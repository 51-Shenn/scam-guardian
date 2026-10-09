import { Button } from '@/components/beui/base.web';
import type { ActionProps } from './action.types';

export function Action({ label, onPress, secondary, disabled, large, small }: ActionProps) {
  const size = small ? 'h-[42px] px-[18px] text-[15px]' : large ? 'h-16 px-7 text-lg' : 'h-[52px] px-[26px] text-base';
  return <Button size="lg" variant={secondary ? 'outline' : 'primary'} onClick={onPress} disabled={disabled}
    className={`${size} whitespace-nowrap rounded-full font-body font-normal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent`}>{label}</Button>;
}
