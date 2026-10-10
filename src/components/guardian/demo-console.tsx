import { Text, View } from 'react-native';
import { FlagPennantIcon, PulseIcon, ShieldCheckIcon } from '@/components/bank/icons';
import { useSession } from '@/components/bank/session';
import { Glass } from '@/components/glass/glass';
import { COOL_DOWN_MS, fixtures, scenarios } from '@/domain/session';
import { evaluate, type Decision, type Scenario } from '@/domain/risk';
import { AiReview } from './ai-review';
import { Meter, Pips } from './charts';
import { Label, Segmented } from './controls';
import { DecisionSummary } from './decision-summary';
import { MetricsExport } from './metrics-export';
import { PrepareAiCase, RequestControl } from './request-control';
import { body, caption, figures } from './text';
import { fill, ink, wash, type Tone } from './tones';
import { EvaluationControl, RunSummary } from './warning-metrics';

interface PanelProps {
  className?: string;
  /** Mouse-sized controls for the wide stage, whose height is fixed by the phone beside it. Otherwise every control is a full touch target. */
  dense?: boolean;
}

const pause = `${COOL_DOWN_MS / 1000}-second pause`;
const responses: Record<Decision['response'], string> = {
  continue: 'No interruption.',
  guide: 'Simple mode: one step at a time.',
  cooldown: `A ${pause} to verify through a trusted contact.`,
  hold: `A ${pause} and a family alert. The person still decides.`,
};
// What the demonstration rules alone ask for, beside the signals they read.
const ruled: Record<Decision['response'], [string, Tone | undefined]> = {
  continue: ['Rules quiet', undefined], guide: ['Rules: guide', 'Struggling'], cooldown: ['Rules: pause', 'Coached'], hold: ['Rules: pause and alert', 'Coached'],
};
const raisedBy = { rule: 'rules', ai: 'AI', combined: 'rules and AI' };
// The amount track runs to twice the line the hold rule draws, at three times the usual amount.
const AMOUNT_LINE = 3;
const seconds = (ms: number) => `${Math.floor(ms / 1000)} s`;
const card = 'gap-2.5 p-[18px]';
const section = 'border-t border-line pt-2.5';

/** A signal's value. One that points towards a class carries that class's tone, as a dot and the text shade; the rest stay plain. */
function Value({ children, tone }: { children: string; tone?: Tone }) {
  if (!tone) return <Text className={`${body} text-ink`} style={figures}>{children}</Text>;
  return <View className="flex-row items-center gap-1.5">
    <View className={`h-2 w-2 rounded-full ${fill[tone]}`} />
    <Text className={`${body} ${ink[tone]}`} style={figures}>{children}</Text>
  </View>;
}

/** Guardian's view of the current transfer session: the answer, the signals behind the rules while it is monitoring, and the AI review. Nothing in it is pressed. */
export function ReadOut({ className = '' }: PanelProps) {
  const { session, view, measurement } = useSession();
  const { signals, decision, monitoring } = view;
  // When the warning first reached the screen, counted from the start of the transfer.
  const shown = measurement?.firstWarningMs ?? null;
  const chosen = monitoring ? decision.classification : null;
  const pending = chosen === 'Normal' && session.ai.status === 'waiting';
  const unavailable = chosen === 'Normal' && session.ai.status === 'unavailable';
  const heading = pending ? 'Checking payment…' : unavailable ? 'AI unavailable'
    : chosen === 'Normal' ? 'No warning currently'
    : chosen ? (decision.response === 'hold' ? 'Coached, high' : chosen) : 'Monitoring inactive';
  const summary = pending ? 'Waiting for the first AI score. No rule asks for a pause.'
    : unavailable ? 'The AI could not score this payment. The demo rules still apply.'
    : chosen === 'Normal' ? 'No rule or AI warning so far. That does not prove the payment is safe.'
    : chosen ? responses[decision.response] : session.consent ? 'Start a transfer to see Guardian work.' : 'Turn Guardian on in the bank app to see it work.';
  // The rules' own answer, apart from the review the AI may add to the decision.
  const [rule, ruleTone] = ruled[evaluate(signals).response];
  // A cell's third entry is the class the signal points towards while it is present. The app switch has none: no rule and no model uses it.
  const cells: [string, string, Tone | undefined][] = [
    ['Simulated call', session.call ? 'Active' : 'None', session.call ? 'Coached' : undefined],
    ['Simulated app switch', session.away ? `Away ${seconds(view.awayMs)}` : view.awayMs ? `Back, ${seconds(view.awayMs)} away` : 'In bank app', undefined],
    ['Recipient', signals.newRecipient ? 'New' : 'Saved', signals.newRecipient ? 'Coached' : undefined],
    ['Account number', !signals.newRecipient ? 'Not needed' : session.entry === 'pasted' ? 'Pasted' : session.entry ? 'Typed' : 'Not entered', signals.pasted ? 'Coached' : undefined],
  ];
  const over = signals.amountRatio > AMOUNT_LINE;
  return <Glass radius={26} className={`${card} ${className}`}>
    <View aria-live="polite" className="gap-2.5">
      <View>
        <Label icon={ShieldCheckIcon} note={<View className="flex-row items-center gap-1.5">
          <View className={`h-2 w-2 rounded-full ${session.consent ? fill.Normal : 'bg-[#b3a4a9]'}`} />
          <Text className={`${body} ${session.consent ? ink.Normal : 'text-soft'}`}>{session.consent ? 'Guardian on' : 'Guardian off'}</Text>
        </View>}>Guardian read-out</Label>
        <View className="mt-1.5 flex-row flex-wrap items-center justify-between gap-x-2">
          <Text className={`font-display text-[30px] leading-9 tracking-[-0.6px] ${chosen ? ink[chosen] : 'text-ink'}`}>{heading}</Text>
          {view.origin && <View className={`rounded-md px-2 py-0.5 ${wash.Coached}`}>
            <Text className={`font-body text-[13px] leading-[18px] ${ink.Coached}`} style={figures}>Raised by {raisedBy[view.origin]}{shown === null ? '' : ` at ${(shown / 1000).toFixed(1)} s`}</Text>
          </View>}
        </View>
        <Text className={`${body} text-soft`}>{summary}</Text>
        {monitoring && <View className="mt-3"><DecisionSummary /></View>}
      </View>

      {/* The signals belong to a monitored transfer. Outside one there is nothing to read. */}
      {monitoring && <View className={`${section} gap-2.5`}>
        <Label icon={PulseIcon} note={<Value tone={ruleTone}>{rule}</Value>}>Signals</Label>
        <View className="flex-row flex-wrap justify-between gap-x-3 gap-y-2">
          {cells.map(([label, value, tone]) => <View key={label}>
            <Text className={caption}>{label}</Text>
            <Value tone={tone}>{value}</Value>
          </View>)}
        </View>
        <View className="flex-row items-start gap-3">
          <Text className={`w-[56px] ${caption}`}>Amount</Text>
          <View className="flex-1"><Meter value={signals.amountRatio / (AMOUNT_LINE * 2)} line={0.5} lineLabel={`${AMOUNT_LINE}x`} tone={over ? fill.Coached : fill.Normal}
            label={`Amount is ${signals.amountRatio.toFixed(1)} times the usual transfer; the rules look above ${AMOUNT_LINE} times`} /></View>
          <View className="w-[100px] items-end"><Value tone={over ? 'Coached' : undefined}>{`${signals.amountRatio.toFixed(1)}x usual`}</Value></View>
        </View>
        <View className="flex-row gap-3">
          {([['Back steps', signals.backPresses, 3], ['Help taps', signals.helpTaps, 2]] as const).map(([label, count, of]) => <View key={label} className="flex-1 flex-row items-center gap-2">
            <Text className={caption}>{label}</Text>
            <Pips count={count} of={of} tone={fill.Struggling} />
            <Value tone={count > 0 ? 'Struggling' : undefined}>{String(count)}</Value>
          </View>)}
        </View>
      </View>}

      <View className={section}><AiReview /></View>
      <Text className={caption}>Simulated sessions. The AI score is not a scam probability.</Text>
    </View>
  </Glass>;
}

// Each preset carries the tone of the class it leads to, in a lighter shade on the chosen, dark tile.
const presetTone: Record<Scenario, Tone> = { normal: 'Normal', struggling: 'Struggling', medium: 'Coached', coached: 'Coached' };
const onDark = { Normal: 'bg-[#8fcdb8]', Struggling: 'bg-[#a9b3e6]', Coached: 'bg-[#e3b877]' };

/**
 * The controls: a preset for the demo signals, the authored request, and the operator's label with what it has measured.
 * Everything boxed here is pressed. A transfer locks its set-up, so until it ends the choices give way to a line that states them and the one control that still works: delivering the request.
 */
export function Presets({ dense, className = '' }: PanelProps) {
  const { session, dispatch, report, evaluationLabel } = useSession();
  const home = session.step === 'home';
  return <Glass radius={26} className={`${card} ${className}`}>
    {home ? <View className="gap-2">
      <Label icon={FlagPennantIcon} note="Set up here, then press Transfer">Scenario preset</Label>
      <Segmented dense={dense} value={session.scenario} onChange={(scenario) => dispatch({ type: 'scenario', scenario })}
        options={scenarios.map((name) => ({ value: name, label: fixtures[name].label, mark: (on) => <View className={`h-2 w-2 rounded-full ${(on ? onDark : fill)[presetTone[name]]}`} /> }))} />
      <Text className={caption}>{fixtures[session.scenario].note}</Text>
    </View> : <View className="gap-1">
      <Label icon={FlagPennantIcon} note="Locked until this transfer ends">Set-up</Label>
      <Text className={caption}>{fixtures[session.scenario].label} preset. Evaluation label: {evaluationLabel ?? 'none'}.</Text>
    </View>}
    <View className={section}><RequestControl dense={dense} /></View>
    {home && <View className={section}><EvaluationControl dense={dense} /></View>}
    {home && <View className={`${section} gap-3`}>
      <RunSummary />
      <View className="flex-row flex-wrap gap-1">
        <PrepareAiCase dense={dense} />
        <MetricsExport dense={dense} json={JSON.stringify(report, null, 2)} />
      </View>
    </View>}
  </Glass>;
}
