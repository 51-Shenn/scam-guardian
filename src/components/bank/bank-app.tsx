import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInRight } from 'react-native-reanimated';
import { Glass } from '@/components/glass/glass';
import { AmountStep } from './amount';
import { Backdrop } from './backdrop';
import { Home } from './home';
import { OtherApp } from './other-app';
import { RecipientStep } from './recipient';
import { ReviewStep } from './review';
import { useSession } from './session';
import { ConsentSheet, PauseSheet } from './sheets';
import { Success } from './success';

export interface BankAppProps {
  /** Space reserved above and below: the frame's status row and home indicator, or the device safe areas. */
  top: number;
  bottom: number;
  /** Shows a close control on the home screen. Used when the app is a full-screen route. */
  onExit?: () => void;
  /** False for the tap-through preview, so it ignores the hardware keyboard. */
  interactive?: boolean;
}

export function BankApp({ top, bottom, onExit, interactive = true }: BankAppProps) {
  const { session } = useSession();
  const [toast, setToast] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const soon = () => {
    setToast(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(false), 1800);
  };
  const { step } = session;
  if (session.away) return <OtherApp top={top} bottom={bottom} />;
  // A push for forward steps; a plain fade for the two resting screens.
  const entering = step === 'home' || step === 'success' ? FadeIn.duration(250) : FadeInRight.duration(380).easing(Easing.bezier(0.16, 1, 0.3, 1));
  return <View className="flex-1 bg-b-surface">
    {/* The colour field moves with each screen, so the glass above it always has something to blur. */}
    <Animated.View key={step} entering={entering} style={{ flex: 1 }}>
      <Backdrop field="calm" />
      {step === 'home' && <Home top={top} bottom={bottom} onSoon={soon} onExit={onExit} />}
      {step === 'recipient' && <RecipientStep top={top} bottom={bottom} />}
      {step === 'amount' && <AmountStep top={top} bottom={bottom} keys={interactive} />}
      {step === 'review' && <ReviewStep top={top} bottom={bottom} />}
      {step === 'success' && <Success top={top} bottom={bottom} />}
    </Animated.View>
    {session.sheet === 'consent' && <ConsentSheet bottom={bottom} />}
    {session.sheet === 'pause' && <PauseSheet bottom={bottom} />}
    {toast && <Animated.View entering={FadeIn.duration(200)} role="status" style={{ position: 'absolute', zIndex: 20, alignSelf: 'center', bottom: bottom + 92 }}>
      <Glass tone="dark" radius={20} className="px-4 py-2.5"><Text className="font-body text-sm text-white">Not part of this demo</Text></Glass>
    </Animated.View>}
  </View>;
}
