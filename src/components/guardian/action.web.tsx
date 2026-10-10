import { Button } from '@/components/beui/base.web';
import type { ActionProps } from './action.types';

export function Action({ label, onPress, secondary, disabled, large, small, icon: Glyph, iconOnly }: ActionProps) {
  const bare = !!Glyph && iconOnly;
  const side = small ? 42 : large ? 64 : 52;
  const size = small ? 'h-[42px] px-[18px] text-[15px]' : large ? 'h-16 px-7 text-lg' : 'h-[52px] px-[26px] text-base';
  // An icon-only action is a circle. Its size is set inline so the row it sits in can never squeeze it into a sliver.
  return <Button size="lg" variant={secondary ? 'outline' : 'primary'} onClick={onPress} disabled={disabled} aria-label={bare ? label : undefined} title={bare ? label : undefined}
    style={bare ? { width: side, minWidth: side, height: side, padding: 0, flexShrink: 0 } : undefined}
    className={`${size} shrink-0 whitespace-nowrap rounded-full font-body font-normal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent`}>
    {Glyph && <Glyph size={small ? 18 : 20} color="currentColor" />}{!bare && label}
  </Button>;
}
