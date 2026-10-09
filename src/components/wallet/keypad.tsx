import { Pressable, Text, View } from 'react-native';
import { BackspaceIcon } from './icons';
import { W } from './palette';

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
const names: Record<string, string> = { del: 'Delete', '.': 'Decimal point' };

export function Keypad({ onKey, large }: { onKey: (key: string) => void; large: boolean }) {
  return <View className="flex-row flex-wrap px-4">
    {keys.map((key) => <View key={key} className="w-1/3 p-1">
      <Pressable accessibilityRole="button" accessibilityLabel={names[key] ?? key} onPress={() => onKey(key)}
        className={`items-center justify-center rounded-2xl bg-white active:scale-95 active:bg-w-tint focus-visible:outline-2 focus-visible:outline-[#ffb300] ${large ? 'h-[62px]' : 'h-14'}`}>
        {key === 'del' ? <BackspaceIcon size={24} color={W.ink} /> : <Text className={`font-body text-w-ink ${large ? 'text-[28px]' : 'text-2xl'}`}>{key}</Text>}
      </Pressable>
    </View>)}
  </View>;
}
