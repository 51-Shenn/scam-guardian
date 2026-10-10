import { Switch } from '@/components/beui/switch.web';
import type { ToggleProps } from './toggle.types';

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return <Switch checked={checked} onCheckedChange={onChange} ariaLabel={label} />;
}
