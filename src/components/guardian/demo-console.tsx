import { Pressable, Text, View } from 'react-native';
import { useSession } from '@/components/bank/session';
import { Glass } from '@/components/glass/glass';
import { fixtures, scenarios, type AiView } from '@/domain/session';
import type { Decision } from '@/domain/risk';
import { WarningMetrics } from './warning-metrics';
import { RequestControl } from './request-control';

interface PanelProps { className?: string }
interface DemoConsoleProps extends PanelProps {
  /** Drops the signal table where space is tight. The "simulated" labels always stay. */
  compact?: boolean;
}

const classes: Decision['classification'][] = ['Normal', 'Struggling', 'Coached'];
// Class colours are data, not brand: red would read as an accusation, and Struggling calls for help instead.
const fill = { Normal: 'bg-[#12905a]', Struggling: 'bg-[#2457c5]', Coached: 'bg-[#b45309]' };
const ink = { Normal: 'text-ink', Struggling: 'text-[#2457c5]', Coached: 'text-b-amber' };
const responses: Record<Decision['response'], string> = {
  continue: 'No interruption.',
  guide: 'Switch to Simple mode and guide one step at a time.',
  cooldown: 'Pause for 15 seconds: ask whether someone is directing this, and verify through a trusted contact.',
  hold: 'Pause, ask, and prepare the family alert. The person still decides.',
};
const small = 'font-body text-[13px] text-soft';
const seconds = (ms: number) => `${Math.floor(ms / 1000)} s`;

/** The four presets. A choice sets the simulated call and what the next transfer starts with. */
function PresetChoice({ detailed }: { detailed?: boolean }) {
  const { session, dispatch } = useSession();
  return <View accessibilityRole="radiogroup" className={detailed ? 'gap-1.5' : 'flex-row flex-wrap gap-1.5'}>
    {scenarios.map((name) => {
      const on = session.scenario === name;
      const { label, note } = fixtures[name];
      return <Pressable key={name} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => dispatch({ type: 'scenario', scenario: name })}
        className={`rounded-[14px] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${on ? 'bg-ink' : 'bg-white/70'} ${detailed ? 'px-3.5 py-2' : 'h-10 grow basis-[45%] items-center justify-center'}`}>
        <Text className={`font-body ${detailed ? 'text-[15px]' : 'text-sm'} ${on ? 'text-white' : 'text-ink'}`}>{label}</Text>
        {detailed && <Text className={`font-body text-[13px] leading-[18px] ${on ? 'text-white/80' : 'text-soft'}`}>{note}</Text>}
      </Pressable>;
    })}
  </View>;
}

function ReadOutBody({ compact }: { compact?: boolean }) {
  const { session, view } = useSession();
  const { signals, decision, monitoring, active } = view;
  const chosen = monitoring ? decision.classification : null;
  const rows: [string, string][] = [
    ['Call', session.call ? 'Active (simulated)' : 'None'],
    ['App switch', session.away ? `Away ${seconds(view.awayMs)} (simulated)` : view.awayMs ? `Back · ${seconds(view.awayMs)} away` : 'In bank app'],
    ['Recipient', active ? (signals.newRecipient ? 'New' : 'Saved') : 'Not chosen'],
    ['Account number', !active || !signals.newRecipient ? 'Not entered' : session.entry === 'pasted' ? 'Pasted' : session.entry ? 'Typed' : 'Not entered'],
    ['Amount', active ? `${signals.amountRatio.toFixed(1)}x usual` : 'Not entered'],
    ['Back steps', String(signals.backPresses)],
    ['Help taps', String(signals.helpTaps)],
  ];
  return <View aria-live="polite">
    <View className="flex-row items-baseline justify-between gap-2">
      <Text className={small}>Guardian read-out</Text>
      <Text className={small}>{session.consent ? 'Guardian on' : 'Guardian off'}</Text>
    </View>
    <Text className={`mt-1 font-display text-[28px] leading-8 tracking-[-0.5px] ${chosen ? ink[chosen] : 'text-ink'}`}>{chosen ? (decision.response === 'hold' ? 'Coached, high' : chosen) : 'Monitoring inactive'}</Text>
    <Text className="mt-1 font-body text-sm leading-5 text-soft">{chosen ? responses[decision.response] : session.consent ? 'Start a transfer to see Guardian work.' : 'Turn Guardian on in the bank app to see it work.'}</Text>

    {/* Which class the rules picked. Bars are on or off: the demo rules produce no scores. */}
    <View className="mt-3.5 gap-2">
      {classes.map((name) => <View key={name} accessibilityLabel={`${name}${name === chosen ? ', selected' : ''}`} className="flex-row items-center gap-2.5">
        <Text className={`w-[78px] font-body text-sm ${name === chosen ? 'text-ink' : 'text-soft'}`}>{name}</Text>
        <View className="h-2 flex-1 overflow-hidden rounded-full bg-[#eadfe2]">{name === chosen && <View className={`h-2 rounded-full ${fill[name]}`} />}</View>
      </View>)}
    </View>

    <Text className={`mt-3.5 ${small}`}>Reasons</Text>
    {decision.reasons.map((reason) => <View key={reason} className="mt-1 flex-row items-center gap-2">
      <View className={`h-1.5 w-1.5 rounded-full ${chosen ? fill[chosen] : 'bg-[#b3a4a9]'}`} />
      <Text className="flex-1 font-body text-sm leading-5 text-ink">{reason}</Text>
    </View>)}

    <AiReview />
    <WarningMetrics />

    {!compact && <View className="mt-3.5 flex-row flex-wrap gap-1.5">
      {rows.map(([label, value]) => <View key={label} className="grow basis-[45%] rounded-xl bg-white/70 px-2.5 py-1">
        <Text className="font-body text-[11.5px] text-soft">{label}</Text>
        <Text className="font-body text-[13px] text-ink">{value}</Text>
      </View>)}
    </View>}
    <Text className="mt-2.5 font-body text-xs leading-4 text-soft">{view.origin === 'ai' ? 'The transaction rules did not request a pause; the frozen AI model recommended review.' : 'Review origin is recorded separately for rules and AI.'} These are simulated sessions. AI outputs binary review; the three presentation classes come from demo policy.</Text>
  </View>;
}

const aiText: Record<AiView['status'], string> = {
  off: 'Off while Guardian is off.',
  waiting: 'Checks every 5 seconds during the transfer.',
  unavailable: 'AI unavailable. The demo rules still apply.',
  clear: 'No additional AI review.',
  review: 'Review recommended: pause and verify.',
};

/** The on-device model's binary review. Its score is uncalibrated, so it is never shown as a percentage. */
function AiReview() {
  const { session } = useSession();
  const { status, score, threshold, cutoff } = session.ai;
  return <View className="mt-3.5 gap-1 rounded-xl bg-white/70 px-3 py-2.5">
    <View className="flex-row items-baseline justify-between gap-2">
      <Text className="font-body text-[13px] text-soft">AI review (on device)</Text>
      {cutoff !== null && <Text className="font-body text-[11.5px] text-soft" style={{ fontVariant: ['tabular-nums'] }}>at {cutoff / 1000} s</Text>}
    </View>
    <Text className={`font-body text-[15px] leading-5 ${status === 'review' ? 'text-b-amber' : 'text-ink'}`}>{aiText[status]}</Text>
    {score !== null && threshold !== null && <Text className="font-body text-[13px] text-ink" style={{ fontVariant: ['tabular-nums'] }}>Score {score.toFixed(2)} · review at {threshold.toFixed(2)}</Text>}
    <Text className="font-body text-[11.5px] leading-4 text-soft">Trained on simulated sessions; not a scam probability. Not yet retrained for full account numbers.</Text>
  </View>;
}

/** Guardian's view of the current transfer session. */
export function ReadOut({ className = '' }: PanelProps) {
  return <Glass radius={26} className={`p-4 ${className}`}><ReadOutBody /></Glass>;
}

/** The presets with what each one sets up. */
export function Presets({ className = '' }: PanelProps) {
  return <Glass radius={26} className={`gap-2.5 p-4 ${className}`}>
    <Text className={small}>Try these. Each one presets the demo signals.</Text>
    <PresetChoice detailed />
    <RequestControl />
  </Glass>;
}

/** Preset switch and read-out in one panel, for the product page. Everything here is a demo signal, and says so. */
export function DemoConsole({ compact, className = '' }: DemoConsoleProps) {
  return <Glass radius={26} className={`p-4 ${className}`}>
    <Text className={`mb-2.5 ${small}`}>Demo signal, simulated</Text>
    <PresetChoice />
    <View className="mt-3.5"><RequestControl /></View>
    <View className="mt-3.5 border-t border-line pt-3.5"><ReadOutBody compact={compact} /></View>
  </Glass>;
}
