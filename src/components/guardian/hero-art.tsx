import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { designs, type Design } from '@/constants/designs';

const art = {
  fluid: require('@/assets/guardian/fluid.svg'),
  grid: require('@/assets/guardian/grid.svg'),
  ledger: require('@/assets/guardian/ledger.svg'),
};

export function HeroArt({ design }: { design: Design }) {
  return <View className="overflow-hidden rounded-3xl border border-slate-200" style={{ backgroundColor: designs[design].background }}>
    <Image source={art[design]} style={{ width: '100%', height: 240 }} contentFit="contain" accessible={false} />
    <View className="gap-4 px-8 pb-8">
      <Text className="font-display text-3xl text-slate-900">Room to pause.</Text>
      <Text className="font-body text-lg leading-7 text-slate-600">A little space between an instruction and a decision.</Text>
    </View>
  </View>;
}
