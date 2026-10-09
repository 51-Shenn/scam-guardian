import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import type { FlowArtProps } from './flow-art.types';

// Android shows the flow field drawn once (scripts/build-native-art.mjs). No render loop runs for decoration.
export function FlowArt({ paused }: FlowArtProps) {
  return <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', opacity: paused ? 0.45 : 1 }]}>
    <Image source={require('@/assets/guardian/current.svg')} style={{ flex: 1 }} contentFit="cover" accessible={false} />
  </View>;
}
