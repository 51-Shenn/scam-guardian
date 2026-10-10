import { Pressable, Text, View } from 'react-native';
import { Glass } from '@/components/glass/glass';
import { BackspaceIcon } from './icons';
import { B } from './palette';

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
const names: Record<string, string> = { del: 'Delete', '.': 'Decimal point' };

export function Keypad({ onKey, large }: { onKey: (key: string) => void; large: boolean }) {
  return <View className="flex-row flex-wrap px-4">
    {keys.map((key) => <View key={key} className="w-1/3 p-1">
      <Pressable accessibilityRole="button" accessibilityLabel={names[key] ?? key} onPress={() => onKey(key)}
        className="rounded-[18px] active:scale-95 active:opacity-70 focus-visible:outline-2 focus-visible:outline-accent">
        <Glass radius={18} className={`items-center justify-center ${large ? 'h-[62px]' : 'h-14'}`}>
          {key === 'del' ? <BackspaceIcon size={24} color={B.ink} /> : <Text className={`font-body text-b-ink ${large ? 'text-[28px]' : 'text-2xl'}`}>{key}</Text>}
        </Glass>
      </Pressable>
    </View>)}
  </View>;
}
