import { Pressable, Text, View } from 'react-native';
import { useSession } from '@/components/bank/session';
import type { EvaluationLabel } from '@/domain/measurement';
import { MetricsExport } from './metrics-export';

const labels: EvaluationLabel[] = [null, 'Normal', 'Struggling', 'Coached-medium', 'Coached-high'];
const seconds = (ms: number | null) => ms === null ? 'Not measured' : `${(ms / 1000).toFixed(2)} s`;

/** Operator annotations and observed metrics. These controls never become model features. */
export function WarningMetrics() {
  const { report, measurement: active, evaluationLabel, annotate } = useSession();
  const stats = report.summary;
  const last = report.sessions.at(-1);
  return <View className="mt-3.5 gap-2 rounded-xl border border-line bg-white/70 p-3">
    <Text accessibilityRole="header" className="font-body text-[15px] text-ink">Warning measurements · simulated</Text>
    <Text className="font-body text-xs leading-4 text-soft">Choose the intended scenario label before starting. Labels are separate from predictions.</Text>
    <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-1.5">
      {labels.map((label) => <Pressable key={label ?? 'unlabelled'} accessibilityRole="radio"
        accessibilityLabel={`Evaluation label ${label ?? 'Unlabelled'}`}
        accessibilityState={{ checked: label === evaluationLabel, disabled: active !== null }} disabled={active !== null}
        onPress={() => annotate(label)} className={`min-h-11 justify-center rounded-xl px-2.5 ${label === evaluationLabel ? 'bg-ink' : 'bg-white'} ${active ? 'opacity-50' : ''}`}>
        <Text className={`font-body text-xs ${label === evaluationLabel ? 'text-white' : 'text-ink'}`}>{label ?? 'Unlabelled'}</Text>
      </Pressable>)}
    </View>
    {active && <Text className="font-body text-xs leading-4 text-ink">Current: first AI positive {seconds(active.firstPositiveMs)} · first shown warning {seconds(active.firstWarningMs)} ({active.warningOrigin ?? 'none'}).</Text>}
    <Text className="font-body text-sm leading-5 text-ink">False-intervention rate: {stats.falseInterventionRate === null ? 'Not measured' : `${(stats.falseInterventionRate * 100).toFixed(1)}%`} ({stats.falseInterventionSessions}/{stats.legitimateSessions} legitimate sessions)</Text>
    <Text className="font-body text-sm leading-5 text-ink">Median observed warning lead: {seconds(stats.medianObservedLeadMs)} ({stats.observedLeadSampleCount}/{stats.confirmedCoachedSessions} confirmed coached sessions).</Text>
    <Text className="font-body text-xs leading-4 text-soft">Observed lead includes the 15-second pause and user delay. Unbiased shadow lead is not measured. Warnings from rules and AI both count.</Text>
    <Text className="font-body text-xs leading-4 text-ink">Before-review interval: {seconds(stats.medianWarningToReviewMs)}. Confirmed coached sessions without a warning: {stats.confirmedCoachedWithoutWarning}.</Text>
    {last && <Text className="font-body text-xs leading-4 text-ink">Last: {last.label ?? 'Unlabelled'} · {last.outcome} · warning {seconds(last.firstWarningMs)} · confirmation {seconds(last.confirmationMs)} · lead {seconds(last.observedLeadMs)}.</Text>}
    <Text className="font-body text-xs leading-4 text-soft">{report.retention.retainedSessions}/20 sessions kept in this app run; {report.retention.evictedSessions} older sessions evicted. Excluded: {stats.abandonedSessions} abandoned, {stats.unlabelledSessions} unlabelled (may overlap). {stats.sessionsWithoutSuccessfulPrediction} evaluated sessions had no successful AI prediction. Export before reloading.</Text>
    <MetricsExport json={JSON.stringify(report, null, 2)} />
  </View>;
}
