import { Text, View } from 'react-native';
import { useSession } from '@/components/bank/session';
import { decisionSupport } from '@/domain/decision-support';

/** Plain-language decision support for Android and web; keeps display policy separate from trained review. */
export function DecisionSummary() {
  const { session, view } = useSession();
  const support = decisionSupport(session, view);
  const explanation = session.ai.triggerExplanation;
  const strongest = explanation?.contributions.filter((c) => c.value > 0).sort((a, b) => b.value - a.value).slice(0, 3) ?? [];
  const against = explanation?.contributions.filter((c) => c.value < 0).sort((a, b) => a.value - b.value)[0];
  return <View className="mt-3.5 gap-1.5 rounded-xl border border-line bg-white/70 p-3">
    <Text accessibilityRole="header" className="font-body text-base text-ink">Decision support</Text>
    <Text className="font-body text-[15px] leading-5 text-ink">{support.category}</Text>
    <Text className="font-body text-sm text-b-amber">Priority: {support.priority}</Text>
    <Text className="font-body text-sm leading-5 text-ink">{support.reason}</Text>
    <Text className="font-body text-sm leading-5 text-ink">Next: {support.action}</Text>
    <Text className="font-body text-xs leading-4 text-soft">{support.basis}. All request and call context is simulated.</Text>
    {explanation && <View className="mt-1 gap-1 border-t border-line pt-2">
      <Text className="font-body text-sm text-ink">{view.monitoring ? '' : 'Last transfer: '}Why the first AI review fired</Text>
      <Text className="font-body text-xs leading-4 text-soft">Actual LR contribution at {explanation.cutoffMs / 1000} s. Positive values push toward review; they are not percentages or proof of causation.</Text>
      {strongest.map((c) => <Text key={c.feature} className="font-body text-xs leading-4 text-ink">{c.label}{c.missing ? ' (missing-input term)' : ''}: +{c.value.toFixed(2)}</Text>)}
      {against && <Text className="font-body text-xs leading-4 text-ink">Largest term against review: {against.label}{against.missing ? ' (missing-input term)' : ''}: {against.value.toFixed(2)}</Text>}
      <Text className="font-body text-xs leading-4 text-ink">All terms + intercept = {explanation.margin.toFixed(2)}; threshold {explanation.thresholdMargin.toFixed(2)}. Reconstructed score {explanation.reconstructedScore.toFixed(4)}.</Text>
      <Text className="font-body text-xs leading-4 text-soft">The warning stays latched; the latest score can differ. XGB tree attribution is not implemented.</Text>
    </View>}
    {session.ai.latched && !explanation && <Text className="font-body text-xs leading-4 text-soft">The first positive prefix has no LR decomposition. XGB tree attribution is not implemented.</Text>}
  </View>;
}
