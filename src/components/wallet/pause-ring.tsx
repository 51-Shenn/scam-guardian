import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { W } from './palette';

const RADIUS = 34;
const LENGTH = 2 * Math.PI * RADIUS;

/** fraction runs from 1 (pause just started) to 0 (pause over). */
export function PauseRing({ fraction, seconds }: { fraction: number; seconds: number }) {
  return <View aria-hidden className="h-[76px] w-[76px] items-center justify-center">
    <Svg width={76} height={76} viewBox="0 0 76 76" style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={38} cy={38} r={RADIUS} fill="none" stroke="rgba(138, 75, 0, 0.18)" strokeWidth={6} />
      <Circle cx={38} cy={38} r={RADIUS} fill="none" stroke={W.amber} strokeWidth={6} strokeLinecap="round" strokeDasharray={LENGTH} strokeDashoffset={LENGTH * (1 - fraction)} />
    </Svg>
    <Text className="font-body text-[26px] text-[#4f2b00]" style={{ fontVariant: ['tabular-nums'] }}>{seconds}</Text>
  </View>;
}
