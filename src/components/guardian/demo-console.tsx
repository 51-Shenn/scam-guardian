import { Pressable, Text, View } from 'react-native';
import { useSession } from '@/components/bank/session';
import { Glass } from '@/components/glass/glass';
import { fixtures, scenarios, type AiView } from '@/domain/session';
import type { Decision, Scenario } from '@/domain/risk';

interface PanelProps {
  className?: string;
  /** The same content set tighter, for the wide stage, whose height is fixed by the phone beside it. */
  dense?: boolean;
}

const classes: Decision['classification'][] = ['Normal', 'Struggling', 'Coached'];
// Class colours are data, not brand: red would read as an accusation, and Struggling calls for help instead.
// Three deep, quiet tones that sit with the garnet of the page: pine, indigo and bronze. Each has a fill, a text shade and a pale wash.
const fill = { Normal: 'bg-[#1f6b57]', Struggling: 'bg-[#414f8f]', Coached: 'bg-[#a3661c]' };
const ink = { Normal: 'text-[#17574a]', Struggling: 'text-[#36427a]', Coached: 'text-[#7c4a0c]' };
// A class that is not chosen keeps the wash of its tone, so the three read as a legend and not as empty tracks.
const wash = { Normal: 'bg-[#dde9e4]', Struggling: 'bg-[#e2e5f1]', Coached: 'bg-[#f0e5d3]' };
type Tone = Decision['classification'] | undefined;

/** A signal's value. One that points towards a class carries that class's tone, as a dot and the text shade; the rest stay plain. */
function Value({ children, tone, size }: { children: string; tone: Tone; size: string }) {
  if (!tone) return <Text className={`font-body text-ink ${size}`}>{children}</Text>;
  return <View className="flex-row items-center gap-1.5">
    <View className={`h-1.5 w-1.5 rounded-full ${fill[tone]}`} />
    <Text className={`font-body ${size} ${ink[tone]}`}>{children}</Text>
  </View>;
}
const responses: Record<Decision['response'], string> = {
  continue: 'No interruption.',
  guide: 'Switch to Simple mode and guide one step at a time.',
  cooldown: 'Pause for 15 seconds: ask whether someone is directing this, and verify through a trusted contact.',
  hold: 'Pause, ask, and prepare the family alert. The person still decides.',
};
const small = 'font-body text-[13px] text-soft';
const seconds = (ms: number) => `${Math.floor(ms / 1000)} s`;
const line = 'h-5 flex-row items-center';

const aiText: Record<AiView['status'], string> = {
  off: 'Off while Guardian is off.',
  waiting: 'Checks every 5 seconds during the transfer.',
  unavailable: 'AI unavailable. The demo rules still apply.',
  clear: 'No additional AI review.',
  review: 'Review recommended: pause and verify.',
};
// The review's state shows as a rule down the side of its box: pine when clear, bronze when it asks for a pause, indigo while it waits.
const aiRule: Record<AiView['status'], string> = { off: 'bg-[#d9cdd0]', waiting: fill.Struggling, unavailable: 'bg-[#d9cdd0]', clear: fill.Normal, review: fill.Coached };
const aiInk: Record<AiView['status'], string> = { off: 'text-soft', waiting: 'text-ink', unavailable: 'text-soft', clear: ink.Normal, review: ink.Coached };

/** The on-device model's binary review. Its score is uncalibrated, so it is never shown as a percentage. */
function AiReview({ dense }: { dense?: boolean }) {
  const { session } = useSession();
  const { status, score, threshold, cutoff } = session.ai;
  return <View className={`flex-row gap-2.5 rounded-xl bg-white/70 ${dense ? 'mt-3 px-2.5 py-2' : 'mt-3.5 px-3 py-2.5'}`}>
    <View className={`w-[3px] rounded-full ${aiRule[status]}`} />
    <View className={`flex-1 ${dense ? 'gap-0.5' : 'gap-1'}`}>
      <View className="flex-row items-baseline justify-between gap-2">
        <Text className="font-body text-[13px] text-soft">AI review (on device)</Text>
        {cutoff !== null && <Text className="font-body text-[11.5px] text-soft" style={{ fontVariant: ['tabular-nums'] }}>at {cutoff / 1000} s</Text>}
      </View>
      <Text className={`font-body leading-5 ${dense ? 'text-sm' : 'text-[15px]'} ${aiInk[status]}`}>{aiText[status]}</Text>
      {score !== null && threshold !== null && <Text className="font-body text-[13px] text-ink" style={{ fontVariant: ['tabular-nums'] }}>Score {score.toFixed(2)} · review at {threshold.toFixed(2)}</Text>}
      <Text className="font-body text-[11.5px] leading-4 text-soft">Trained on simulated sessions; not a scam probability. Not yet retrained for full account numbers.</Text>
    </View>
  </View>;
}

/** Guardian's view of the current transfer session. */
export function ReadOut({ dense, className = '' }: PanelProps) {
  const { session, view } = useSession();
  const { signals, decision, monitoring, active } = view;
  const chosen = monitoring ? decision.classification : null;
  // The signals in the three groups the design draws them from: where the person is, what the transfer is, and how they move through it.
  // A row's third entry is the class the signal points towards while it is present. The app switch has none: no rule and no model uses it.
  const groups: [string, [string, string, Tone][]][] = [
    ['Situation', [
      ['Call', session.call ? 'Active (simulated)' : 'None', session.call ? 'Coached' : undefined],
      ['App switch', session.away ? `Away ${seconds(view.awayMs)} (simulated)` : view.awayMs ? `Back · ${seconds(view.awayMs)} away` : 'In bank app', undefined],
    ]],
    ['Transaction', [
      ['Recipient', active ? (signals.newRecipient ? 'New' : 'Saved') : 'Not chosen', active && signals.newRecipient ? 'Coached' : undefined],
      ['Account number', !active || !signals.newRecipient ? 'Not entered' : session.entry === 'pasted' ? 'Pasted' : session.entry ? 'Typed' : 'Not entered', active && signals.pasted ? 'Coached' : undefined],
      // Above three times the usual amount, the same line the hold rule draws.
      ['Amount', active ? `${signals.amountRatio.toFixed(1)}x usual` : 'Not entered', active && signals.amountRatio > 3 ? 'Coached' : undefined],
    ]],
    ['Behaviour', [
      ['Back steps', String(signals.backPresses), signals.backPresses > 0 ? 'Struggling' : undefined],
      ['Help taps', String(signals.helpTaps), signals.helpTaps > 0 ? 'Struggling' : undefined],
    ]],
  ];
  const rows = groups.flatMap(([, list]) => list);
  return <Glass radius={26} className={`${dense ? 'p-3.5' : 'p-4'} ${className}`}>
    <View aria-live="polite">
      <View className="flex-row items-baseline justify-between gap-2">
        <Text className={small}>Guardian read-out</Text>
        <View className="flex-row items-center gap-1.5">
          <View className={`h-1.5 w-1.5 rounded-full ${session.consent ? fill.Normal : 'bg-[#b3a4a9]'}`} />
          <Text className={`font-body text-[13px] ${session.consent ? ink.Normal : 'text-soft'}`}>{session.consent ? 'Guardian on' : 'Guardian off'}</Text>
        </View>
      </View>
      <Text className={`mt-1 font-display tracking-[-0.5px] ${dense ? 'text-2xl leading-7' : 'text-[28px] leading-8'} ${chosen ? ink[chosen] : 'text-ink'}`}>{chosen ? (decision.response === 'hold' ? 'Coached, high' : chosen) : 'Monitoring inactive'}</Text>
      <Text className={`mt-1 font-body text-soft ${dense ? 'text-[13px] leading-[18px]' : 'text-sm leading-5'}`}>{chosen ? responses[decision.response] : session.consent ? 'Start a transfer to see Guardian work.' : 'Turn Guardian on in the bank app to see it work.'}</Text>

      {/* Which class the rules picked. Bars are on or off: the demo rules produce no scores. */}
      {dense ? <View className="mt-3 flex-row gap-1.5">
        {/* The three classes on one line: a bar each, with its name under it. */}
        {classes.map((name) => <View key={name} accessibilityLabel={`${name}${name === chosen ? ', selected' : ''}`} className="flex-1 gap-1">
          <View className={`h-2 rounded-full ${name === chosen ? fill[name] : wash[name]}`} />
          <Text className={`font-body text-xs ${name === chosen ? ink[name] : 'text-soft'}`}>{name}</Text>
        </View>)}
      </View> : <View className="mt-3.5 gap-2">
        {classes.map((name) => <View key={name} accessibilityLabel={`${name}${name === chosen ? ', selected' : ''}`} className="flex-row items-center gap-2.5">
          <Text className={`w-[78px] font-body text-sm ${name === chosen ? ink[name] : 'text-soft'}`}>{name}</Text>
          <View className={`h-2 flex-1 overflow-hidden rounded-full ${wash[name]}`}>{name === chosen && <View className={`h-2 rounded-full ${fill[name]}`} />}</View>
        </View>)}
      </View>}

      <Text className={`${dense ? 'mt-3' : 'mt-3.5'} ${small}`}>Reasons</Text>
      {decision.reasons.map((reason) => <View key={reason} className="mt-1 flex-row items-center gap-2">
        <View className={`h-1.5 w-1.5 rounded-full ${chosen ? fill[chosen] : 'bg-[#b3a4a9]'}`} />
        <Text className={`flex-1 font-body text-ink ${dense ? 'text-[13px] leading-[18px]' : 'text-sm leading-5'}`}>{reason}</Text>
      </View>)}

      <AiReview dense={dense} />

      {/* Dense: a table on one grid. The group is named down the left, then every label and every value starts on the same line as the ones above it. Otherwise two tiles to a row. */}
      {dense ? <View className="mt-3 rounded-xl bg-white/70 px-3 py-1">
        {groups.map(([group, list], index) => <View key={group} className={`flex-row ${index ? 'mt-[3px] border-t border-line pt-[3px]' : ''}`}>
          <Text className="w-[100px] font-body text-[10.5px] uppercase leading-5 tracking-[0.7px] text-soft">{group}</Text>
          <View className="flex-1">
            {list.map(([label, value, tone]) => <View key={label} className={line}>
              <Text className="w-[116px] font-body text-xs text-soft">{label}</Text>
              <Value tone={tone} size="text-[12.5px]">{value}</Value>
            </View>)}
          </View>
        </View>)}
      </View> : <View className="mt-3.5 flex-row flex-wrap gap-1.5">
        {rows.map(([label, value, tone]) => <View key={label} className="grow basis-[45%] rounded-xl bg-white/70 px-2.5 py-1">
          <Text className="font-body text-[11.5px] text-soft">{label}</Text>
          <Value tone={tone} size="text-[13px]">{value}</Value>
        </View>)}
      </View>}
      <Text className={`font-body text-xs leading-4 text-soft ${dense ? 'mt-2' : 'mt-2.5'}`}>Classification by demo rules on simulated signals. The AI review is the on-device model.</Text>
    </View>
  </Glass>;
}

// Each preset carries the tone of the class it leads to, in a lighter shade on the chosen, dark row.
const presetTone: Record<Scenario, Decision['classification']> = { normal: 'Normal', struggling: 'Struggling', medium: 'Coached', coached: 'Coached' };
const onDark = { Normal: 'bg-[#8fcdb8]', Struggling: 'bg-[#a9b3e6]', Coached: 'bg-[#e3b877]' };

/** The four presets with what each one sets up. A choice sets the simulated call and what the next transfer starts with. */
export function Presets({ dense, className = '' }: PanelProps) {
  const { session, dispatch } = useSession();
  return <Glass radius={26} className={`${dense ? 'gap-2 p-3.5' : 'gap-2.5 p-4'} ${className}`}>
    <Text className={small}>Try these. Each one presets the demo signals.</Text>
    <View accessibilityRole="radiogroup" className={dense ? 'gap-1' : 'gap-1.5'}>
      {scenarios.map((name) => {
        const on = session.scenario === name;
        const { label, note } = fixtures[name];
        return <Pressable key={name} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => dispatch({ type: 'scenario', scenario: name })}
          className={`rounded-[14px] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${on ? 'bg-ink' : 'bg-white/70'} ${dense ? 'px-3 py-1' : 'px-3.5 py-2'}`}>
          <View className="flex-row items-center gap-2">
            <View className={`h-2 w-2 rounded-full ${(on ? onDark : fill)[presetTone[name]]}`} />
            <Text className={`font-body ${dense ? 'text-sm' : 'text-[15px]'} ${on ? 'text-white' : 'text-ink'}`}>{label}</Text>
          </View>
          <Text className={`pl-4 font-body ${dense ? 'text-xs leading-4' : 'text-[13px] leading-[18px]'} ${on ? 'text-white/80' : 'text-soft'}`}>{note}</Text>
        </Pressable>;
      })}
    </View>
  </Glass>;
}
