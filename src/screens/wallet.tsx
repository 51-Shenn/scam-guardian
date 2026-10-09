import { useEffect } from 'react';
import { BackHandler, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Action } from '@/components/guardian/action';
import { DemoConsole } from '@/components/guardian/demo-console';
import { FlowArt } from '@/components/guardian/flow-art';
import { PhoneFrame } from '@/components/guardian/phone-frame';
import { Wordmark } from '@/components/guardian/wordmark';
import { useSession } from '@/components/wallet/session';
import { Wallet } from '@/components/wallet/wallet';
import { FRAME, WIDE } from '@/constants/layout';
import { useViewport } from '@/hooks/use-viewport';

export default function WalletScreen() {
  const viewport = useViewport();
  const insets = useSafeAreaInsets();
  const { session, view, dispatch } = useSession();
  const { step, sheet } = session;

  // Android back walks the transfer backwards before it leaves the screen.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheet) { dispatch({ type: 'closeSheet' }); return true; }
      if (step === 'home') return false;
      dispatch(step === 'success' ? { type: 'done' } : { type: 'back' });
      return true;
    });
    return () => subscription.remove();
  }, [step, sheet, dispatch]);

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  if (!viewport) return <View className="flex-1 bg-page" />;

  // Narrow web and Android: the device is the phone, so there is no frame.
  if (viewport.width < WIDE) return <View className="flex-1 bg-w-surface">
    <StatusBar style={step === 'home' ? 'light' : 'dark'} />
    <Wallet top={Math.max(insets.top, 12)} bottom={Math.max(insets.bottom, 10)} onExit={leave} />
  </View>;

  const scale = Math.min(viewport.height * 0.84, 840) / FRAME.height;
  return <View className="flex-1 bg-page">
    <FlowArt paused={step === 'review' && view.locked} />
    <View className="mx-auto w-full max-w-[1320px] flex-1 px-10">
      <View className="h-[72px] flex-row items-center justify-between">
        <Wordmark onPress={() => router.replace('/')} />
        <View><Action small secondary label="Product page" onPress={leave} /></View>
      </View>
      <View className="flex-1 flex-row items-center justify-center gap-10 pb-8">
        <DemoConsole className="w-[300px]" />
        <PhoneFrame scale={scale} chrome={step === 'home' ? 'light' : 'dark'} callActive={view.fixture.call}>
          <Wallet top={FRAME.statusBar} bottom={FRAME.homeIndicator} />
        </PhoneFrame>
      </View>
    </View>
  </View>;
}
