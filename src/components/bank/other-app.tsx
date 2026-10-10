import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { groupDigits } from '@/domain/session';
import { BankButton } from './button';
import { ArrowUUpLeftIcon, ChatCircleTextIcon, CopyIcon } from './icons';
import { B } from './palette';
import { useSession } from './session';

/** A made-up account number for the scripted scam message. Not a real account. */
const SCAM_ACCOUNT = '883012745521';

interface Thread { from: string; meta: string; messages: string[]; account: string | null }
const coached: Thread = {
  from: '+60 11-2345 6789', meta: 'Unknown number',
  messages: [
    'This is Inspector Lim from the police. Your bank account is linked to a money laundering case.',
    `To protect your savings, transfer them to this safe account now: ${groupDigits(SCAM_ACCOUNT)}`,
    'Do not tell anyone, including your family. Stay on the line.',
  ],
  account: SCAM_ACCOUNT,
};
const family: Thread = {
  from: 'Aina', meta: 'Daughter',
  messages: ['Mak, can you send RM 50 for groceries? Thank you!'],
  account: null,
};

/**
 * The simulated other app Rohani switches to: a generic messaging app. It is a picture driven by the demo,
 * and Guardian reads nothing inside it.
 */
export function OtherApp({ top, bottom }: { top: number; bottom: number }) {
  const { session, dispatch } = useSession();
  const [copied, setCopied] = useState<'no' | 'yes' | 'failed'>('no');
  const thread = session.scenario === 'coached' || session.scenario === 'medium' ? coached : family;
  const copy = async () => {
    if (!thread.account) return;
    const done = await Clipboard.setStringAsync(thread.account).then(() => true, () => false);
    setCopied(done ? 'yes' : 'failed');
  };
  return <Animated.View entering={FadeIn.duration(220)} accessibilityViewIsModal style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 30 }} className="bg-[#eef1f6]">
    <View className="flex-row items-center gap-3 border-b border-b-line bg-white px-4 pb-3" style={{ paddingTop: top + 10 }}>
      <View aria-hidden className="h-10 w-10 items-center justify-center rounded-full bg-[#2f6fde]"><ChatCircleTextIcon size={22} color="#ffffff" weight="fill" /></View>
      <View className="flex-1">
        <Text accessibilityRole="header" className="font-body text-[17px] text-b-ink">{thread.from}</Text>
        <Text className="font-body text-[13px] text-b-muted">Messages · {thread.meta}</Text>
      </View>
    </View>
    <ScrollView className="flex-1" contentContainerClassName="gap-2.5 px-4 py-4">
      <Text className="text-center font-body text-[12px] text-b-muted">Simulated app. Guardian never sees inside other apps.</Text>
      {thread.messages.map((message) => <View key={message} className="max-w-[86%] self-start rounded-[20px] rounded-bl-md bg-white px-3.5 py-2.5">
        <Text className="font-body text-[16px] leading-[22px] text-b-ink">{message}</Text>
      </View>)}
    </ScrollView>
    <View className="gap-2 px-4 pt-2.5" style={{ paddingBottom: bottom + 10 }}>
      {thread.account && <BankButton variant="line" label={copied === 'yes' ? 'Copied. Paste it in the bank app' : copied === 'failed' ? 'Could not copy. Type it instead' : 'Copy account number'} icon={<CopyIcon size={18} color={B.ink} />} onPress={copy} />}
      <Pressable accessibilityRole="button" onPress={() => dispatch({ type: 'toggleAway', now: Date.now() })}
        className="h-[54px] flex-row items-center justify-center gap-2 rounded-full bg-b-ink active:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        <ArrowUUpLeftIcon size={20} color="#ffffff" />
        <Text className="font-body text-[17px] text-white">Back to bank app</Text>
      </Pressable>
    </View>
  </Animated.View>;
}
