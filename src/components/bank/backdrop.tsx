import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

// Soft colour fields for the glass to sit on. Each glow is [centre x, centre y, radius, colour, opacity], as fractions of the box.
type Glow = readonly [number, number, number, string, number];
const fields: Record<'hero' | 'calm' | 'night', { base: string; glows: readonly Glow[] }> = {
  hero: { base: '#b90e2a', glows: [[0.96, 0, 0.8, '#f0453f', 0.6], [0.02, 1, 0.85, '#5f0717', 0.9], [0.3, 0.3, 0.5, '#d81f4b', 0.45]] },
  calm: { base: '#f5f5f8', glows: [[1, 0, 0.62, '#f6bcc7', 0.85], [0, 0.55, 0.6, '#ffd7c8', 0.7], [0.95, 1, 0.5, '#ffdfbd', 0.6]] },
  night: { base: '#1a0a11', glows: [[0.9, 0.08, 0.8, '#a8122f', 0.8], [0.05, 0.7, 0.7, '#5a1640', 0.6], [0.7, 1, 0.6, '#c2452d', 0.4]] },
};

/** Fills its parent, behind the content. Drawn once; nothing animates. */
export function Backdrop({ field }: { field: keyof typeof fields }) {
  const id = useId().replace(/:/g, '');
  const { base, glows } = fields[field];
  return <View aria-hidden style={[StyleSheet.absoluteFill, { backgroundColor: base, pointerEvents: 'none' }]}>
    <Svg width="100%" height="100%">
      <Defs>
        {glows.map(([cx, cy, r, color, opacity], index) => <RadialGradient key={index} id={`${id}${index}`} cx={cx} cy={cy} r={r}>
          <Stop offset="0" stopColor={color} stopOpacity={opacity} /><Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>)}
      </Defs>
      {glows.map((_, index) => <Rect key={index} width="100%" height="100%" fill={`url(#${id}${index})`} />)}
    </Svg>
  </View>;
}
