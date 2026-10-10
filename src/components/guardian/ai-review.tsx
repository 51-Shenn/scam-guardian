import { Text, View } from 'react-native';
import { CpuIcon } from '@/components/bank/icons';
import { useSession } from '@/components/bank/session';
import type { AiView } from '@/domain/session';
import { Diverging, Meter } from './charts';
import { Label } from './controls';
import { body, caption, figures } from './text';
import { fill, ink } from './tones';

const state: Record<AiView['status'], string> = { off: 'Off', waiting: 'Waiting for a score', unavailable: 'Unavailable', clear: 'No review', review: 'Review recommended' };
const dot: Record<AiView['status'], string> = { off: 'bg-[#b3a4a9]', waiting: fill.Struggling, unavailable: 'bg-[#b3a4a9]', clear: fill.Normal, review: fill.Coached };
const tone: Record<AiView['status'], string> = { off: 'text-soft', waiting: 'text-ink', unavailable: 'text-soft', clear: ink.Normal, review: ink.Coached };

/** The on-device model's binary review: its score against the review line, then the terms behind the first review. The score is uncalibrated, so it is never shown as a percentage. */
export function AiReview() {
  const { session, view } = useSession();
  const { status, score, threshold, cutoff, model, latched } = session.ai;
  const explanation = session.ai.triggerExplanation;
  const scored = score !== null && threshold !== null;
  // Once a transfer has ended, what stays on screen is that transfer's answer.
  const last = !view.monitoring && status !== 'off';
  const unscored = last && status === 'waiting';
  const note = status === 'off' ? (session.consent ? 'Scores every 5 seconds once a transfer starts.' : 'Off while Guardian is off.')
    : unscored ? 'It ended before the first 5-second score.'
    : status === 'waiting' ? 'Scores every 5 seconds during the transfer.' : 'AI unavailable. The demo rules still apply.';
  const towards = explanation?.contributions.filter((c) => c.value > 0).sort((a, b) => b.value - a.value).slice(0, 3) ?? [];
  const against = explanation?.contributions.filter((c) => c.value < 0).sort((a, b) => a.value - b.value).slice(0, 1) ?? [];
  const terms = [...towards, ...against];
  const largest = Math.max(0, ...terms.map((c) => Math.abs(c.value)));
  return <View className="gap-1.5">
    <Label icon={CpuIcon} note={<View className="flex-row items-center gap-1.5">
      <View className={`h-2 w-2 rounded-full ${dot[status]}`} />
      <Text className={`${body} ${tone[status]}`}>{last ? 'Last transfer: ' : ''}{unscored ? 'no score' : state[status]}</Text>
    </View>}>AI review, on device</Label>
    <Meter value={scored ? score : null} line={threshold} tone={scored && score >= threshold ? fill.Coached : fill.Normal}
      label={scored ? `Review score ${score.toFixed(4)}; the review line is ${threshold.toFixed(4)}` : 'No review score yet'} />
    <View className="flex-row flex-wrap justify-between gap-x-2">
      <Text className={`${caption} ${scored ? 'text-ink' : ''}`} style={figures}>{scored ? `Score ${score.toFixed(4)}, review at ${threshold.toFixed(4)}` : note}</Text>
      {cutoff !== null && <Text className={caption} style={figures}>{model ? `${model}, ` : ''}at {cutoff / 1000} s</Text>}
    </View>

    {explanation && <View className="mt-1.5 gap-1">
      <View className="flex-row flex-wrap justify-between gap-x-2">
        <Text className={`${body} text-ink`}>Why the first AI review fired</Text>
        <Text className={caption} style={figures}>at {explanation.cutoffMs / 1000} s</Text>
      </View>
      {terms.map((c) => <View key={c.feature} className="flex-row items-center gap-2">
        <Text numberOfLines={1} className="flex-1 font-body text-[13.5px] leading-[18px] text-ink">{c.label}{c.missing ? ' (missing input)' : ''}</Text>
        <View className="w-[124px]"><Diverging value={c.value} max={largest} /></View>
        <Text className="w-11 text-right font-body text-[13.5px] leading-[18px] text-ink" style={figures}>{c.value > 0 ? '+' : ''}{c.value.toFixed(2)}</Text>
      </View>)}
      <Text className={caption} style={figures}>Right pushes towards a review. All terms sum to {explanation.margin.toFixed(2)}; review at {explanation.thresholdMargin.toFixed(2)}.</Text>
    </View>}
    {latched && !explanation && <Text className={caption}>This review came from the XGBoost model. Tree attribution is not implemented.</Text>}
  </View>;
}
