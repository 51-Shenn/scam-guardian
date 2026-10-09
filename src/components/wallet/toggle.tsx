import { Switch } from 'react-native';
import { W } from './palette';
import type { ToggleProps } from './toggle.types';

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return <Switch value={checked} onValueChange={onChange} accessibilityLabel={label}
    trackColor={{ false: '#c3ccda', true: W.blue }} thumbColor="#ffffff" />;
}
