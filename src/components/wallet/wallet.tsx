import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInRight } from 'react-native-reanimated';
import { AmountStep } from './amount';
import { Home } from './home';
import { RecipientStep } from './recipient';
import { ReviewStep } from './review';
import { useSession } from './session';
import { ConsentSheet, PauseSheet } from './sheets';
import { Success } from './success';

export interface WalletProps {
  /** Space reserved above and below: the frame's status row and home indicator, or the device safe areas. */
  top: number;
  bottom: number;
  /** Shows a close control on the home screen. Used when the wallet is a full-screen route. */
  onExit?: () => void;
  /** False for the tap-through preview, so it ignores the hardware keyboard. */
  interactive?: boolean;
}

export function Wallet({ top, bottom, onExit, interactive = true }: WalletProps) {
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
  // A push for forward steps; a plain fade for the two resting screens.
  const entering = step === 'home' || step === 'success' ? FadeIn.duration(250) : FadeInRight.duration(380).easing(Easing.bezier(0.16, 1, 0.3, 1));
  return <View className="flex-1 bg-w-surface">
    <Animated.View key={step} entering={entering} style={{ flex: 1 }}>
      {step === 'home' && <Home top={top} bottom={bottom} onSoon={soon} onExit={onExit} />}
      {step === 'recipient' && <RecipientStep top={top} bottom={bottom} />}
      {step === 'amount' && <AmountStep top={top} bottom={bottom} keys={interactive} />}
      {step === 'review' && <ReviewStep top={top} bottom={bottom} />}
      {step === 'success' && <Success top={top} bottom={bottom} />}
    </Animated.View>
    {session.sheet === 'consent' && <ConsentSheet bottom={bottom} />}
    {session.sheet === 'pause' && <PauseSheet bottom={bottom} />}
    {toast && <Animated.View entering={FadeIn.duration(200)} role="status"
      style={{ position: 'absolute', zIndex: 20, alignSelf: 'center', bottom: bottom + 96, borderRadius: 999, backgroundColor: 'rgba(14, 27, 51, 0.9)', paddingHorizontal: 16, paddingVertical: 10 }}>
      <Text className="font-body text-sm text-white">Not part of this demo</Text>
    </Animated.View>}
  </View>;
}
