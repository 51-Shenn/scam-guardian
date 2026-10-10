import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BatteryFullIcon, CellSignalFullIcon, PhoneCallIcon, WifiHighIcon } from '@/components/bank/icons';
import { FRAME } from '@/constants/layout';

interface PhoneFrameProps {
  /** 1 renders the frame at 468 x 984. The wrapper takes the scaled size, so layout around it stays correct. */
  scale: number;
  /** Colour of the status row: light over the bank app's red header, dark elsewhere. */
  chrome: 'light' | 'dark';
  /** A lock screen: its own large clock replaces the small one, and the home indicator turns light. */
  lock?: boolean;
  /** Expands the island into a call indicator. The call is a demo signal and is labelled as simulated. */
  callActive: boolean;
  children: ReactNode;
}

const titanium = ['#f1efea', '#a9a59d', '#ecebe6', '#8d8982', '#dedbd4', '#9e9a92'] as const;
const label = { fontFamily: 'HedvigLettersSans', fontSize: 12.5, color: '#ffffff' } as const;
const key = { position: 'absolute', width: 5, borderRadius: 3, backgroundColor: '#a9a59d' } as const;

function CallTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return <Animated.View entering={FadeIn.delay(200).duration(250)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
    <PhoneCallIcon size={16} color="#39d98a" weight="fill" />
    <Text style={label}>Simulated call</Text>
    <Text style={[label, { color: '#39d98a', fontVariant: ['tabular-nums'] }]}>{clock}</Text>
  </Animated.View>;
}

function Island({ live }: { live: boolean }) {
  const width = useSharedValue(live ? 204 : 124);
  useEffect(() => {
    width.set(withTiming(live ? 204 : 124, { duration: 500, easing: Easing.bezier(0.16, 1, 0.3, 1) }));
  }, [live, width]);
  const animated = useAnimatedStyle(() => ({ width: width.get() }));
  return <Animated.View accessibilityLabel={live ? 'Simulated call in progress' : undefined}
    style={[{ position: 'absolute', top: 14, alignSelf: 'center', height: 36, borderRadius: 20, paddingHorizontal: 12, backgroundColor: '#050506' }, animated]}>
    {live && <CallTimer />}
  </Animated.View>;
}

export function PhoneFrame({ scale, chrome, lock, callActive, children }: PhoneFrameProps) {
  const tint = chrome === 'light' ? '#ffffff' : '#0e1b33';
  return <View style={{ width: FRAME.width * scale, height: FRAME.height * scale }}>
    <View style={{ width: FRAME.width, height: FRAME.height, transform: [{ scale }], transformOrigin: 'top left' }}>
      <View aria-hidden style={[key, { left: -4, top: 168, height: 38 }]} />
      <View aria-hidden style={[key, { left: -4, top: 238, height: 70 }]} />
      <View aria-hidden style={[key, { left: -4, top: 324, height: 70 }]} />
      <View aria-hidden style={[key, { right: -4, top: 270, height: 112 }]} />
      <View style={{ flex: 1, borderRadius: 76, boxShadow: '0 60px 90px -40px rgba(14, 27, 51, 0.42), 0 24px 40px -24px rgba(14, 27, 51, 0.3)' }}>
        <LinearGradient colors={titanium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 76, padding: 5 }}>
          <View style={{ flex: 1, borderRadius: 71, padding: 9, backgroundColor: '#08090b' }}>
            <View style={{ flex: 1, borderRadius: 62, overflow: 'hidden', backgroundColor: '#ffffff' }}>
              {children}
              <View aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: FRAME.statusBar, paddingTop: 20, paddingLeft: 46, paddingRight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none' }}>
                <Text style={{ fontFamily: 'HedvigLettersSans', fontSize: 17, color: tint, opacity: lock ? 0 : 1 }}>9:41</Text>
                <View style={{ flexDirection: 'row', gap: 7 }}>
                  <CellSignalFullIcon size={19} color={tint} weight="fill" /><WifiHighIcon size={19} color={tint} weight="fill" /><BatteryFullIcon size={19} color={tint} weight="fill" />
                </View>
              </View>
              <Island live={callActive} />
              <View aria-hidden style={{ position: 'absolute', bottom: 9, alignSelf: 'center', width: 148, height: 5, borderRadius: 3, backgroundColor: lock ? 'rgba(255, 255, 255, 0.85)' : 'rgba(14, 27, 51, 0.82)', pointerEvents: 'none' }} />
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  </View>;
}
