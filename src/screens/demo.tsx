import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BankApp } from '@/components/bank/bank-app';
import { PhoneCallIcon } from '@/components/bank/icons';
import { useSession } from '@/components/bank/session';
import { Glass } from '@/components/glass/glass';
import { Action } from '@/components/guardian/action';
import { Presets, ReadOut } from '@/components/guardian/demo-console';
import { FamilyScreen } from '@/components/guardian/family-phone';
import { FlowArt } from '@/components/guardian/flow-art';
import { PhoneFrame } from '@/components/guardian/phone-frame';
import { Wordmark } from '@/components/guardian/wordmark';
import { FRAME, WIDE } from '@/constants/layout';
import { useViewport } from '@/hooks/use-viewport';

// The three layouts of the demo. Side by side on a wide screen; one at a time on a phone.
const views = [['bank', 'Bank app'], ['guardian', 'Guardian'], ['family', 'Aina’s phone']] as const;
type ViewName = (typeof views)[number][0];
const caption = 'font-body text-sm text-soft';

// Natural size of the wide layout: read-out panel, Rohani's phone, Aina's phone, with the same gap between each.
const PHONE = 0.8;
const FAMILY = 0.7;
const STAGE = {
  panel: 340, gap: 84, phone: PHONE, family: FAMILY,
  width: 340 + 84 * 2 + Math.round(FRAME.width * (PHONE + FAMILY)),
  height: Math.round(FRAME.height * PHONE) + 30,
};

export default function DemoScreen() {
  const viewport = useViewport();
  const insets = useSafeAreaInsets();
  const { session, view, dispatch } = useSession();
  const [shown, setShown] = useState<ViewName>('bank');
  const { step, sheet, call, away } = session;

  // Android back returns to the bank app, then walks the transfer backwards, before it leaves the screen.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (shown !== 'bank') { setShown('bank'); return true; }
      if (away) { dispatch({ type: 'toggleAway' }); return true; }
      if (sheet) { dispatch({ type: 'closeSheet' }); return true; }
      if (step === 'home') return false;
      dispatch(step === 'success' ? { type: 'done' } : { type: 'back' });
      return true;
    });
    return () => subscription.remove();
  }, [shown, away, step, sheet, dispatch]);

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const toggleCall = () => dispatch({ type: 'toggleCall', now: Date.now() });
  // Leaving and returning both show the result, so the narrow layout moves to the bank app.
  const toggleAway = () => { dispatch({ type: 'toggleAway' }); setShown('bank'); };
  const reset = () => { dispatch({ type: 'reset' }); setShown('bank'); };
  const callLabel = call ? 'End simulated call' : 'Start simulated call';
  const awayLabel = away ? 'Return to bank app' : 'Open another app';
  if (!viewport) return <View className="flex-1 bg-page" />;

  // Narrow web and Android: the device is the phone, so there is no frame. A switch at the top moves between the three views.
  if (viewport.width < WIDE) {
    const bottom = Math.max(insets.bottom, 10);
    return <View className="flex-1 bg-page">
      <StatusBar style="dark" />
      <View className="gap-2 px-3 pb-2" style={{ paddingTop: Math.max(insets.top, 8) + 4 }}>
        <Glass radius={24} className="flex-row p-1">
          <View accessibilityRole="tablist" className="flex-1 flex-row gap-1">
            {views.map(([name, label]) => <Pressable key={name} accessibilityRole="tab" accessibilityState={{ selected: shown === name }} onPress={() => setShown(name)}
              className={`h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-full active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${shown === name ? 'bg-ink' : ''}`}>
              <Text className={`font-body text-sm ${shown === name ? 'text-white' : 'text-ink'}`}>{label}</Text>
              {name === 'family' && view.alert && <View accessibilityLabel="New alert" className="h-2 w-2 rounded-full bg-[#e5484d]" />}
            </Pressable>)}
          </View>
        </Glass>
        {call && <View className="h-11 flex-row items-center gap-2 rounded-full bg-ink pl-4 pr-1.5">
          <PhoneCallIcon size={16} color="#39d98a" weight="fill" />
          <Text className="flex-1 font-body text-sm text-white">Simulated call in progress</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="End simulated call" onPress={toggleCall} className="h-8 justify-center rounded-full bg-white/20 px-3.5 active:opacity-70 focus-visible:outline-2 focus-visible:outline-white">
            <Text className="font-body text-sm text-white">End</Text>
          </Pressable>
        </View>}
      </View>
      <View className="flex-1 overflow-hidden rounded-t-[28px]">
        {shown === 'bank' && <BankApp top={12} bottom={bottom} onExit={leave} />}
        {shown === 'guardian' && <ScrollView className="flex-1" contentContainerClassName="gap-3 px-3 pt-1" contentContainerStyle={{ paddingBottom: bottom + 12 }}>
          <View className="flex-row gap-2">
            <View className="flex-1"><Action small secondary={!call} label={callLabel} onPress={toggleCall} /></View>
            <View><Action small secondary label="Reset demo" onPress={reset} /></View>
          </View>
          <Action small secondary={!away} label={awayLabel} onPress={toggleAway} />
          <ReadOut />
          <Presets />
        </ScrollView>}
        {shown === 'family' && <FamilyScreen top={0} bottom={bottom} />}
      </View>
    </View>;
  }

  // The stage has a fixed natural size and scales as one piece, so all three layouts always fit without scrolling.
  const fit = Math.min((viewport.width - 80) / STAGE.width, (viewport.height - 104) / STAGE.height, 1.25);
  return <View className="flex-1 bg-page">
    <FlowArt paused={step === 'review' && view.locked} />
    <View className="mx-auto h-[72px] w-full max-w-[1480px] flex-row items-center justify-between gap-6 px-10">
      <Wordmark onPress={() => router.replace('/')} />
      <View className="flex-row gap-2.5">
        <View><Action small secondary={!call} label={callLabel} onPress={toggleCall} /></View>
        <View><Action small secondary={!away} label={awayLabel} onPress={toggleAway} /></View>
        <View><Action small secondary label="Reset demo" onPress={reset} /></View>
        <View><Action small secondary label="Product page" onPress={leave} /></View>
      </View>
    </View>
    <View className="flex-1 items-center justify-center pb-8">
      <View style={{ width: STAGE.width * fit, height: STAGE.height * fit }}>
        <View className="flex-row items-center" style={{ width: STAGE.width, height: STAGE.height, gap: STAGE.gap, transform: [{ scale: fit }], transformOrigin: 'top left' }}>
          <View className="gap-3" style={{ width: STAGE.panel }}><ReadOut /><Presets /></View>
          <View className="items-center gap-2.5">
            <Text className={caption}>Rohani&apos;s phone</Text>
            <PhoneFrame scale={STAGE.phone} chrome={step === 'home' && !away ? 'light' : 'dark'} callActive={call}>
              <BankApp top={FRAME.statusBar} bottom={FRAME.homeIndicator} />
            </PhoneFrame>
          </View>
          <View className="items-center gap-2.5">
            <Text className={caption}>Aina&apos;s phone, the trusted contact (simulated)</Text>
            <PhoneFrame scale={STAGE.family} chrome="light" lock callActive={false}>
              <FamilyScreen top={FRAME.statusBar} bottom={FRAME.homeIndicator} />
            </PhoneFrame>
          </View>
        </View>
      </View>
    </View>
  </View>;
}
