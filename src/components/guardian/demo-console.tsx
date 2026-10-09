import { Pressable, Text, View } from 'react-native';
import { useSession } from '@/components/wallet/session';
import { fixtures, scenarios } from '@/domain/session';

interface DemoConsoleProps {
  /** Drops the signal table where space is tight. The "simulated" labels always stay. */
  compact?: boolean;
  className?: string;
}

/** Scenario switch and Guardian read-out. Everything here is a demo signal, and says so. */
export function DemoConsole({ compact, className = '' }: DemoConsoleProps) {
  const { session, view, dispatch } = useSession();
  const { fixture, signals, decision, monitoring, active } = view;
  const tone = !monitoring || decision.classification === 'Normal' ? 'text-ink' : decision.classification === 'Coached' ? 'text-w-amber' : 'text-accent';
  const rows: [string, string][] = [
    ['Call', fixture.call ? 'Active (simulated)' : 'None'],
    ['Recipient', active ? (signals.newRecipient ? 'New' : 'Saved') : 'Not chosen'],
    ['Paste flag', fixture.paste ? 'Present (simulated)' : 'None'],
    ['Amount', active ? `${signals.amountRatio.toFixed(1)}x usual` : 'Not entered'],
    ['Back steps', String(signals.backPresses)],
    ['Help taps', String(signals.helpTaps)],
  ];
  return <View className={`rounded-3xl bg-white/90 p-4 ${className}`} style={{ boxShadow: '0 0 0 1px rgba(12, 26, 51, 0.08), 0 30px 50px -28px rgba(12, 26, 51, 0.35)' }}>
    <Text className="mb-2.5 font-body text-[13px] text-soft">Demo signal, simulated</Text>
    <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-1.5">
      {scenarios.map((name) => {
        const on = session.scenario === name;
        return <Pressable key={name} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => dispatch({ type: 'scenario', scenario: name })}
          className={`h-10 grow basis-[45%] items-center justify-center rounded-[14px] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${on ? 'bg-ink' : 'bg-muted'}`}>
          <Text className={`font-body text-sm ${on ? 'text-white' : 'text-ink'}`}>{fixtures[name].label}</Text>
        </Pressable>;
      })}
    </View>
    <View aria-live="polite" className="mt-3.5 border-t border-line pt-3.5">
      <Text className="font-body text-xs text-soft">Guardian read-out</Text>
      <Text className={`mb-1.5 mt-0.5 font-display text-[27px] leading-[31px] tracking-[-0.5px] ${tone}`}>{monitoring ? decision.classification : 'Monitoring inactive'}</Text>
      {decision.reasons.map((reason) => <Text key={reason} className="font-body text-[13.5px] leading-5 text-soft">{reason}</Text>)}
      {!compact && <View className="mt-2.5 flex-row flex-wrap gap-px overflow-hidden rounded-xl bg-line">
        {rows.map(([label, value]) => <View key={label} className="grow basis-[45%] bg-white px-2.5 py-1.5">
          <Text className="font-body text-[11px] text-soft">{label}</Text>
          <Text className="font-body text-[12.5px] text-ink">{value}</Text>
        </View>)}
      </View>}
      <Text className="mt-2 font-body text-xs text-soft">Demonstration rules, not model output.</Text>
    </View>
  </View>;
}
