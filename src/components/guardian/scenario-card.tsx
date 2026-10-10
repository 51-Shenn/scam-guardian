import { Pressable, Text, View } from 'react-native';
import { ArrowRightIcon } from '@/components/bank/icons';
import { Glass } from '@/components/glass/glass';
import { COOL_DOWN_MS, fixtures, scenarios } from '@/domain/session';
import type { Scenario } from '@/domain/risk';

// Class colours are data, not brand: the read-out's pine, indigo and bronze.
const dot: Record<Scenario, string> = { normal: 'bg-[#1f6b57]', struggling: 'bg-[#414f8f]', medium: 'bg-[#a3661c]', coached: 'bg-[#a3661c]' };
const pause = `${COOL_DOWN_MS / 1000}-second pause`;
const outcome: Record<Scenario, string> = {
  normal: 'No interruption',
  struggling: 'Simple mode, step by step',
  medium: `A ${pause} to think`,
  coached: `A ${pause} and a family alert preview`,
};

/** The four situations and how Guardian answers each. A row opens the demo with that preset chosen. */
export function ScenarioCard({ onPick, className = '' }: { onPick: (scenario: Scenario) => void; className?: string }) {
  return <Glass radius={26} className={`gap-2.5 p-4 ${className}`}>
    <Text className="font-body text-[13px] text-soft">Four situations, four answers</Text>
    <View className="gap-1.5">
      {scenarios.map((name) => <Pressable key={name} accessibilityRole="button" accessibilityLabel={`${fixtures[name].label}: ${outcome[name]}. Open in the demo`} onPress={() => onPick(name)}
        className="flex-row items-center gap-3 rounded-[14px] bg-white/50 px-3.5 py-2 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        <View className={`h-2 w-2 rounded-full ${dot[name]}`} />
        <View className="flex-1">
          <Text className="font-body text-[15px] text-ink">{fixtures[name].label}</Text>
          <Text className="font-body text-[13px] leading-[18px] text-soft">{outcome[name]}</Text>
        </View>
        <ArrowRightIcon size={16} color="#8a7b80" />
      </Pressable>)}
    </View>
    <Text className="font-body text-xs leading-4 text-soft">Each one opens the demo. Its call and app-switch signals are simulated.</Text>
  </Glass>;
}
