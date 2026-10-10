import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Action } from '@/components/guardian/action';
import { FlowArt } from '@/components/guardian/flow-art';
import { Inert } from '@/components/guardian/inert';
import { LOCK_HINT, LockFigure } from '@/components/guardian/lock-figure';
import { PhoneFrame } from '@/components/guardian/phone-frame';
import { Reveal } from '@/components/guardian/reveal';
import { ScenarioCard } from '@/components/guardian/scenario-card';
import { Wordmark } from '@/components/guardian/wordmark';
import { AppWindowIcon, ClipboardIcon, MicrophoneSlashIcon, PhoneSlashIcon, type Icon } from '@/components/bank/icons';
import { useSession } from '@/components/bank/session';
import { BankApp } from '@/components/bank/bank-app';
import { FRAME, WIDE } from '@/constants/layout';
import type { Scenario } from '@/domain/risk';
import { useViewport } from '@/hooks/use-viewport';

const cases: { scenario: Scenario; state: string; title: string; detail: string }[] = [
  { scenario: 'normal', state: 'Normal', title: 'Carry on', detail: 'A usual amount to a saved contact goes through with no interruption.' },
  { scenario: 'struggling', state: 'Struggling', title: 'A clearer path', detail: 'Repeated back steps or help taps switch the app to Simple mode: bigger controls, one instruction at a time. No accusation.' },
  { scenario: 'coached', state: 'Coached', title: 'Take a moment', detail: 'A call in progress plus a new recipient triggers a short pause. When it ends, the choice is still yours.' },
];
const never: [Icon, string][] = [[MicrophoneSlashIcon, 'Call audio'], [PhoneSlashIcon, 'Caller identity'], [ClipboardIcon, 'Clipboard contents'], [AppWindowIcon, 'Activity in other apps']];

const section = 'mx-auto w-full max-w-[1320px] px-5 wide:px-10';
const h2 = 'max-w-[620px] font-display text-[34px] leading-[38px] tracking-[-1px] text-ink wide:text-[54px] wide:leading-[58px] wide:tracking-[-1.6px]';
const intro = 'mt-5 max-w-[560px] font-body text-lg leading-[29px] text-soft';
const h3 = 'font-display text-[28px] leading-8 tracking-[-0.5px]';
const cell = 'rounded-3xl p-[26px] wide:p-[34px]';
const link = 'rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent';
// What the scenario card adds to the phone's width when it stands beside it: 340 wide, less the 28 it laps over the frame.
const CARD = 312;

export default function Landing() {
  const viewport = useViewport();
  const insets = useSafeAreaInsets();
  const { session, view, dispatch } = useSession();
  const scroll = useRef<ScrollView>(null);
  const [copy, setCopy] = useState(0);
  const anchors = useRef({ how: 0, privacy: 0 });
  const wide = !!viewport && viewport.width >= WIDE;

  const openDemo = () => router.push('/demo');
  const jump = (y: number) => scroll.current?.scrollTo({ y, animated: true });
  // The page only shows the bank app. A scenario is played in the demo, with its preset already chosen.
  const play = (scenario: Scenario) => {
    dispatch({ type: 'scenario', scenario });
    openDemo();
  };

  const scale = !viewport ? 0 : wide ? Math.min(viewport.height * 0.84, 840) / FRAME.height : Math.min(340, viewport.width - 56) / FRAME.width;
  // Width left for the copy once the phone has its place. The card stands beside the phone only while the copy keeps enough of it.
  const room = !viewport ? 0 : wide ? Math.min(viewport.width, 1320) - 80 - 64 - FRAME.width * scale : viewport.width - 40;
  const beside = wide && room - CARD >= 440;
  // The headline always sets in two lines: its longer line is a little under eight times the type size.
  // The copy's measured width is used once it is known, because a scrollbar takes some of the estimate.
  const type = Math.max(28, Math.min(wide ? 78 : 44, Math.floor(Math.min(copy || (beside ? room - CARD : room), 640) / 8)));
  const phone = <PhoneFrame scale={scale} chrome={session.step === 'home' ? 'light' : 'dark'} callActive={session.call}>
    <BankApp top={FRAME.statusBar} bottom={FRAME.homeIndicator} interactive={false} />
  </PhoneFrame>;
  // The frame is a picture of the bank app at every width, with one press target over it that opens the demo.
  const preview = <>
    <Inert>{phone}</Inert>
    <Pressable accessibilityRole="button" accessibilityLabel="Open the banking demo" onPress={openDemo} className="absolute inset-0 rounded-[56px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent" />
  </>;

  return <ScrollView ref={scroll} className="flex-1 bg-page" contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
    <View className="overflow-hidden">
      <FlowArt paused={session.step === 'review' && view.locked} />
      <View className={section}>
        <View className="h-16 flex-row items-center gap-9 wide:h-[72px]">
          <View className="mr-auto"><Wordmark onPress={() => jump(0)} /></View>
          {wide && <Pressable accessibilityRole="link" onPress={() => jump(anchors.current.how)} className={link}><Text className="font-body text-[15px] text-soft">How it works</Text></Pressable>}
          {wide && <Pressable accessibilityRole="link" onPress={() => jump(anchors.current.privacy)} className={link}><Text className="font-body text-[15px] text-soft">Privacy</Text></Pressable>}
          <View><Action small label="Try the demo" onPress={openDemo} /></View>
        </View>

        <View className="pb-12 pt-7 wide:flex-row wide:items-center wide:gap-16 wide:pt-0" style={wide && viewport ? { minHeight: viewport.height - 72 } : undefined}>
          <View onLayout={(event) => setCopy(event.nativeEvent.layout.width)} className="wide:flex-1 wide:pb-10">
            <Text accessibilityRole="header" className="max-w-[640px] font-display [text-wrap:balance] text-ink" style={{ fontSize: type, lineHeight: type + 2, letterSpacing: -0.035 * type }}>A pause before the money moves.</Text>
            <Text className="mt-6 max-w-[420px] font-body text-[17px] leading-[27px] text-soft wide:text-[19px] wide:leading-[30px]">Scam Guardian helps when a transfer gets confusing, and makes room to think when someone else may be directing it.</Text>
            <View className="mt-8 flex-row flex-wrap gap-3">
              <View className="min-w-[150px] flex-1 wide:max-w-[200px]"><Action label="Try the demo" onPress={openDemo} /></View>
              <View className="min-w-[150px] flex-1 wide:max-w-[200px]"><Action secondary label="How it works" onPress={() => jump(anchors.current.how)} /></View>
            </View>
            {!beside && <ScenarioCard onPick={play} className="mt-8 wide:max-w-[320px]" />}
          </View>

          {/* The card is centred on the phone and laps over its edge, so the frosted glass has the bank app to blur. */}
          {viewport && wide && <View className="flex-row items-center">
            {beside && <ScenarioCard onPick={play} className="z-10 -mr-7 w-[340px]" />}
            <View>{preview}</View>
          </View>}
          {/* Narrow web and Android: the frame is cropped to its upper part. */}
          {viewport && !wide && <View className="-mx-5 mt-9 h-[430px] items-center overflow-hidden pt-4">{preview}</View>}
        </View>
      </View>
    </View>

    <View onLayout={(event) => { anchors.current.how = event.nativeEvent.layout.y; }} className={`${section} py-[72px] wide:py-[120px]`}>
      <Reveal>
        <Text accessibilityRole="header" className={h2}>Three situations. Three different responses.</Text>
        <Text className={intro}>Hesitation alone does not mean fraud. Guardian reads the context of one transfer and answers with help, or with time.</Text>
      </Reveal>
      <View className="mt-10 wide:mt-14">
        {cases.map((item, index) => <Reveal key={item.scenario}>
          <View className={`gap-2.5 py-7 wide:flex-row wide:items-center wide:gap-8 ${index ? 'border-t border-line' : ''}`}>
            <Text className="font-body text-[15px] text-accent wide:w-[150px]">{item.state}</Text>
            <Text accessibilityRole="header" className="font-display text-[28px] leading-8 tracking-[-0.6px] text-ink wide:flex-1 wide:text-[36px] wide:leading-10">{item.title}</Text>
            <Text className="font-body text-base leading-[26px] text-soft wide:flex-[1.25]">{item.detail}</Text>
            <View className="mt-2 self-start wide:mt-0"><Action small secondary label="Play it" onPress={() => play(item.scenario)} /></View>
          </View>
        </Reveal>)}
      </View>
    </View>

    <View onLayout={(event) => { anchors.current.privacy = event.nativeEvent.layout.y; }} className={`${section} pb-[72px] wide:pb-[120px]`}>
      <Reveal><Text accessibilityRole="header" className={h2}>Your decision. Your privacy.</Text></Reveal>
      <View className="mt-10 gap-4 wide:mt-14 wide:flex-row">
        <Reveal className="wide:flex-[1.25]">
          <View className={`flex-1 bg-[#f8e9ec] ${cell}`}>
            <Text accessibilityRole="header" className={`${h3} text-ink`}>What Guardian never collects</Text>
            <Text className="mt-3 font-body text-base leading-[26px] text-soft">The design works from a summary of the transfer session, kept on the device.</Text>
            <View className="mt-10 flex-row flex-wrap gap-3 wide:mt-auto wide:pt-12">
              {never.map(([Glyph, label]) => <View key={label} className="grow basis-[45%] gap-5 rounded-[14px] bg-white p-4">
                <Glyph size={28} color="#c8102e" /><Text className="font-body text-base text-ink">{label}</Text>
              </View>)}
            </View>
          </View>
        </Reveal>
        <View className="gap-4 wide:flex-1">
          <Reveal>
            <View className={`bg-white ${cell}`}>
              <Text accessibilityRole="header" className={`${h3} text-ink`}>One transfer at a time</Text>
              <Text className="mt-3 font-body text-base leading-[26px] text-soft">Monitoring starts when you choose a recipient and ends when you confirm or cancel. Browsing your balance is outside it.</Text>
            </View>
          </Reveal>
          <Reveal>
            <View className={`bg-accent ${cell}`}>
              <Text accessibilityRole="header" className={`${h3} text-white`}>A trusted contact, on your terms</Text>
              <View className="mt-5 max-w-[340px] self-start rounded-[14px] bg-white px-4 py-3.5"><Text className="font-body text-[15px] leading-[22px] text-ink">A transfer was paused. Please call your family member to check in.</Text></View>
              <Text className="mt-3 font-body text-base leading-[26px] text-white">No amount. No account details. You choose the person, with separate consent.</Text>
            </View>
          </Reveal>
        </View>
      </View>
    </View>

    <View className={`${section} gap-8 pb-[72px] wide:flex-row wide:items-center wide:gap-14 wide:pb-[120px]`}>
      <Reveal className="wide:flex-1">
        <Text accessibilityRole="header" className={h2}>A pause, never a block.</Text>
        <Text className={intro}>If a transfer looks coached, Guardian holds it for 15 seconds. Then Continue unlocks and the choice is yours. A canal lock works the same way: it holds a boat, then lets it through.{LOCK_HINT}</Text>
      </Reveal>
      <View className="w-full wide:w-[640px]"><LockFigure /></View>
    </View>

    <View className="border-t border-line">
      <View className={`${section} py-12`}>
        <Text className="max-w-[620px] font-body text-[14.5px] leading-6 text-soft">Prototype for Dormathon 2026. Mock money, simulated call and paste signals, demonstration rules in place of a trained model, and a family alert that stays on this screen as a preview. Not connected to a bank.</Text>
      </View>
    </View>
  </ScrollView>;
}
