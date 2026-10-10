import { Text, View } from 'react-native';
import { fill, idle } from './tones';

// The marks of the read-out, drawn with plain views so Android and web show the same thing.
const share = (fraction: number): `${number}%` => `${Math.round(Math.min(1, Math.max(0, fraction)) * 1000) / 10}%`;

interface MeterProps {
  /** Level and line as fractions of the track. A null level leaves the track empty. */
  value: number | null;
  line?: number | null;
  /** Shown under the line, to name the level it marks. */
  lineLabel?: string;
  tone: string;
  label: string;
}

/** A level on a track, with the line it is judged against. */
export function Meter({ value, line = null, lineLabel, tone, label }: MeterProps) {
  return <View role="img" accessibilityLabel={label} className={lineLabel ? 'pb-3.5' : ''}>
    <View className="h-4 justify-center">
      <View className={`h-2 overflow-hidden rounded-full ${idle}`}>
        {value !== null && <View className={`h-full rounded-full ${tone}`} style={{ width: share(value) }} />}
      </View>
      {line !== null && <View className="absolute top-0 -ml-px h-4 w-0.5 rounded-full bg-ink" style={{ left: share(line) }} />}
    </View>
    {line !== null && lineLabel && <View className="absolute bottom-0 left-0 right-0 flex-row">
      <View style={{ flex: line }} />
      <View style={{ flex: 1 - line }}><Text className="-ml-2 font-body text-xs leading-[14px] text-soft">{lineLabel}</Text></View>
    </View>}
  </View>;
}

/** A count against the number that matters: one pip for each step up to it. */
export function Pips({ count, of, tone }: { count: number; of: number; tone: string }) {
  return <View className="flex-row gap-1">
    {Array.from({ length: of }, (_, index) => <View key={index} className={`h-2.5 w-2.5 rounded-full ${index < count ? tone : idle}`} />)}
  </View>;
}

/** One term of a sum, drawn from a centre line: towards a review to the right, against it to the left. */
export function Diverging({ value, max }: { value: number; max: number }) {
  const width = share(max > 0 ? Math.abs(value) / max : 0);
  return <View className="h-4 flex-row items-center">
    <View className="flex-1 flex-row justify-end">{value < 0 && <View className={`h-2.5 rounded-l-[3px] ${fill.Normal}`} style={{ width }} />}</View>
    <View className="h-4 w-px bg-[#a8999e]" />
    <View className="flex-1 flex-row">{value > 0 && <View className={`h-2.5 rounded-r-[3px] ${fill.Coached}`} style={{ width }} />}</View>
  </View>;
}
