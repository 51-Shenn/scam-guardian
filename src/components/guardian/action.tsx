import { Button, Host, Text } from '@expo/ui';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import type { ActionProps } from './action.types';

export function Action({ label, onPress, secondary, disabled, large, small }: ActionProps) {
  const height = small ? 44 : large ? 64 : 52;
  return (
    <Host matchContents={small ? true : { vertical: true }} colorScheme="light" seedColor="#1447E6" style={small ? { minHeight: height } : { width: '100%', minHeight: height }}>
      <Button label={label} onPress={onPress} disabled={disabled}
        modifiers={small ? [] : [fillMaxWidth()]} variant={secondary ? 'outlined' : 'filled'} style={{ height, paddingHorizontal: small ? 16 : 20 }}>
        <Text textStyle={{ fontSize: large ? 20 : small ? 15 : 16 }}>{label}</Text>
      </Button>
    </Host>
  );
}
