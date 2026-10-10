import { Button } from '@/components/beui/base.web';
import type { ActionProps } from './action.types';

export function Action({ label, onPress, secondary, disabled, large, small, icon: Glyph, iconOnly }: ActionProps) {
  const bare = !!Glyph && iconOnly;
  const size = small ? `h-[42px] text-[15px] ${bare ? 'w-[42px] px-0' : 'px-[18px]'}` : large ? `h-16 text-lg ${bare ? 'w-16 px-0' : 'px-7'}` : `h-[52px] text-base ${bare ? 'w-[52px] px-0' : 'px-[26px]'}`;
  return <Button size="lg" variant={secondary ? 'outline' : 'primary'} onClick={onPress} disabled={disabled} aria-label={bare ? label : undefined} title={bare ? label : undefined}
    className={`${size} whitespace-nowrap rounded-full font-body font-normal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent`}>
    {Glyph && <Glyph size={small ? 18 : 20} color="currentColor" />}{!bare && label}
  </Button>;
}
