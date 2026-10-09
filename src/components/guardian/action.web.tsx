import { Button } from '@/components/beui/base.web';
import type { ActionProps } from './action.types';

export function Action({ label, onPress, secondary, disabled, large }: ActionProps) {
  return <Button size="lg" variant={secondary ? 'outline' : 'primary'} onClick={onPress}
    disabled={disabled} className={`${large ? 'min-h-16 text-lg' : 'min-h-13 text-base'} rounded-xl px-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700`}>{label}</Button>;
}
