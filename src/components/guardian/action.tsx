import { Button, Host, Text } from '@expo/ui';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import type { ActionProps } from './action.types';

export function Action({ label, onPress, secondary, disabled, large }: ActionProps) {
  return (
    <Host matchContents={{ vertical: true }} colorScheme="light" seedColor="#244EBC" style={{ width: '100%', minHeight: large ? 64 : 52 }}>
      <Button label={label} onPress={onPress} disabled={disabled}
        modifiers={[fillMaxWidth()]} variant={secondary ? 'outlined' : 'filled'} style={{ height: large ? 64 : 52, paddingHorizontal: 20 }}>
        <Text textStyle={{ fontSize: large ? 20 : 16 }}>{label}</Text>
      </Button>
    </Host>
  );
}
