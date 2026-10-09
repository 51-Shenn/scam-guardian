import { Host, TextInput } from '@expo/ui';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import { Text, View } from 'react-native';
import type { FieldProps } from './field.types';
export function Field({ label, initialValue, onChange, numeric, large }: FieldProps) {
  return <View className="gap-3">
    <Text className="font-body text-lg text-slate-900">{label}</Text>
    <Host matchContents={{ vertical: true }} style={{ width: '100%' }} colorScheme="light" seedColor="#244EBC">
      <TextInput defaultValue={initialValue} onChangeText={onChange} placeholder={label}
        keyboardType={numeric ? 'decimal-pad' : 'default'} autoCorrect={false} modifiers={[fillMaxWidth()]}
        style={{ height: large ? 72 : 60, borderRadius: 12, borderWidth: 1, borderColor: '#64748B', paddingHorizontal: 16 }}
        textStyle={{ fontSize: large ? 28 : 24, color: '#0F172A' }} />
    </Host>
  </View>;
}
