import { Text, View } from 'react-native';
import { TagIcon } from '@/components/bank/icons';
import { useSession } from '@/components/bank/session';
import type { EvaluationLabel, WarningOrigin } from '@/domain/measurement';
import { Meter } from './charts';
import { Label, Segmented } from './controls';
import { body, caption, figures } from './text';
import { fill } from './tones';

const labels: EvaluationLabel[] = [null, 'Normal', 'Struggling', 'Coached-medium', 'Coached-high'];
const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
const by: Record<WarningOrigin, string> = { ai: 'by the AI', rule: 'by the rules', combined: 'by rules and AI' };
const burden = (rate: number | null) => rate === null ? 'No labelled legitimate sessions yet' : `${(rate * 100).toFixed(1)}% of legitimate sessions were warned`;

/** The operator's own label for the next transfer. An annotation for the measurements: it never becomes a model feature. */
export function EvaluationControl({ dense }: { dense?: boolean }) {
  const { measurement: active, evaluationLabel, annotate } = useSession();
  return <View className="gap-2">
    <Label icon={TagIcon} note={active ? 'Locked during a transfer' : 'Your annotation, not a model input'}>Evaluation label</Label>
    <Segmented dense={dense} value={evaluationLabel} onChange={annotate} disabled={active !== null}
      options={labels.map((label) => ({ value: label, label: label ?? 'None', accessibilityLabel: `Evaluation label ${label ?? 'Unlabelled'}` }))} />
  </View>;
}

/** The run's two headline measurements on one line, beside the label that feeds them. */
export function RunSummary() {
  const { report } = useSession();
  const stats = report.summary;
  return <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
    <View className="min-w-[200px] flex-1 flex-row items-center gap-2">
      <Text className={caption}>False interventions</Text>
      <Text className={`${body} text-ink`} style={figures}>{stats.falseInterventionSessions} of {stats.legitimateSessions}</Text>
      <View className="flex-1"><Meter value={stats.falseInterventionRate} tone={fill.Coached} label={burden(stats.falseInterventionRate)} /></View>
    </View>
    <View className="flex-row items-center gap-2 border-l border-line pl-3">
      <Text className={caption}>Median lead</Text>
      <Text className={`${body} text-ink`} style={figures}>{stats.medianObservedLeadMs === null ? 'Not measured' : seconds(stats.medianObservedLeadMs)}</Text>
    </View>
  </View>;
}

/** What this app run has measured: the burden on legitimate sessions, the lead a warning gave, and the latest transfer. */
export function WarningMetrics() {
  const { report, measurement: active } = useSession();
  const stats = report.summary;
  const last = report.sessions.at(-1);
  const value = 'font-body text-xl leading-7 text-ink';
  const column = 'min-w-[150px] flex-1 gap-0.5';
  const warned = active ? active.firstWarningMs : last ? last.firstWarningMs : null;
  const origin = active ? active.warningOrigin : last ? last.warningOrigin : null;
  return <View className="flex-row flex-wrap gap-x-6 gap-y-4 rounded-2xl bg-white p-5">
    <View className={column}>
      <Text className={caption}>False interventions</Text>
      <Text className={value} style={figures}>{stats.falseInterventionSessions} of {stats.legitimateSessions}</Text>
      <Meter value={stats.falseInterventionRate} tone={fill.Coached} label={burden(stats.falseInterventionRate)} />
      <Text className={caption}>legitimate sessions warned</Text>
    </View>
    <View className={column}>
      <Text className={caption}>Median warning lead</Text>
      <Text className={value} style={figures}>{stats.medianObservedLeadMs === null ? 'Not measured' : seconds(stats.medianObservedLeadMs)}</Text>
      <Text className={caption} style={figures}>{stats.observedLeadSampleCount} of {stats.confirmedCoachedSessions} confirmed coached sessions</Text>
    </View>
    <View className={column}>
      <Text className={caption}>{active ? 'This transfer' : 'Last transfer'}</Text>
      <Text className={value} style={figures}>{!active && !last ? 'None yet' : warned === null ? (active ? 'No warning yet' : 'No warning') : `Warned at ${seconds(warned)}`}</Text>
      <Text className={caption}>{active ? (origin ? by[origin] : 'First warning shown') : last ? `${last.label ?? 'Unlabelled'}, ${last.outcome}` : 'Start a transfer in the demo'}</Text>
    </View>
  </View>;
}
