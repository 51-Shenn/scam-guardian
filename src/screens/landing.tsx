import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Action } from '@/components/guardian/action';
import { HeroArt } from '@/components/guardian/hero-art';
import { designs, resolveDesign, type Design } from '@/constants/designs';

export default function Landing() {
  const { design: parameter } = useLocalSearchParams();
  const design = resolveDesign(parameter);
  const theme = designs[design];
  return <ScrollView className="flex-1" style={{ backgroundColor: theme.background }} contentInsetAdjustmentBehavior="automatic">
    <View className="mx-auto w-full max-w-7xl px-6 pb-16">
      <View className="min-h-20 flex-row flex-wrap items-center justify-between gap-4 py-4">
        <Text className="font-display text-2xl text-slate-900">Scam Guardian</Text>
        <Action label="Try the demo" onPress={() => router.push('/demo')} secondary />
      </View>
      <View className="gap-8 py-12 lg:flex-row lg:items-center">
        <View className="gap-7 lg:flex-1">
          <Text className="font-display text-[46px] leading-[53px] text-slate-900 lg:text-[72px] lg:leading-[79px]">A pause that{ '\n' }protects a choice.</Text>
          <Text className="max-w-xl font-body text-xl leading-8 text-slate-600">Help when a transfer feels difficult. A pause when someone else may be directing it.</Text>
          <View className="flex-row flex-wrap gap-3"><Action label="Open wallet demo" onPress={() => router.push('/demo')} /></View>
        </View>
        <View className="w-full lg:flex-1"><HeroArt design={design} /></View>
      </View>
      <View className="gap-5 border-t border-slate-300 py-12">
        <Text className="font-display text-4xl text-slate-900">Different moments. Different support.</Text>
        <Text className="max-w-2xl font-body text-lg leading-7 text-slate-600">Hesitation alone does not mean fraud. Context helps us offer guidance or make room for a second opinion.</Text>
        {[
          ['Normal', 'Carry on', 'An ordinary transfer continues without interruption.'],
          ['Struggling', 'Find your way', 'Clearer steps help you finish with confidence.'],
          ['Coached', 'Take a moment', 'A temporary pause and a trusted contact help you check the situation.'],
        ].map(([label, title, detail]) => <View key={label} className="gap-3 py-5 lg:flex-row lg:items-baseline">
          <Text className="w-36 font-body text-base" style={{ color: theme.accent }}>{label}</Text>
          <Text className="font-display text-3xl text-slate-900 lg:flex-1">{title}</Text>
          <Text className="font-body text-lg leading-7 text-slate-600 lg:flex-1">{detail}</Text>
        </View>)}
      </View>
      <View className="gap-5 rounded-3xl bg-white p-8">
        <Text className="font-display text-4xl text-slate-900">Your decision. Your privacy.</Text>
        <Text className="max-w-2xl font-body text-lg leading-7 text-slate-600">The proposed Guardian uses session summaries on your device. It does not need your call audio or clipboard contents.</Text>
        <Text className="max-w-2xl font-body text-base leading-6 text-slate-600">This prototype uses mock money, demonstration rules, simulated call signals, and a local alert preview. It is not connected to a bank.</Text>
      </View>
      <View className="gap-5 py-12">
        <Text className="font-display text-3xl text-slate-900">Choose a visual direction</Text>
        {(Object.keys(designs) as Design[]).map((key) => <View key={key} className="gap-3 py-3">
          <Action label={designs[key].name} secondary={key !== design} onPress={() => router.setParams({ design: key })} />
          <Text className="font-body text-base leading-6 text-slate-600">{designs[key].summary}</Text>
        </View>)}
      </View>
      <Text className="font-body text-sm text-slate-600">Scam Guardian / Dormathon 2026 prototype</Text>
    </View>
  </ScrollView>;
}
