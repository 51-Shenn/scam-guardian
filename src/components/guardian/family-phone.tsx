import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Backdrop } from '@/components/bank/backdrop';
import { PhoneCallIcon, ShieldCheckIcon } from '@/components/bank/icons';
import { useSession } from '@/components/bank/session';
import { Glass } from '@/components/glass/glass';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function Alert() {
  const [calling, setCalling] = useState(false);
  return <Glass tone="dark" radius={26} className="gap-2 p-4">
    <View className="flex-row items-center gap-2">
      <View aria-hidden className="h-6 w-6 items-center justify-center rounded-[7px] bg-accent"><ShieldCheckIcon size={15} color="#ffffff" weight="fill" /></View>
      <Text className="flex-1 font-body text-[15px] text-white/90">Scam Guardian</Text>
      <Text className="font-body text-[15px] text-white/90">now</Text>
    </View>
    <Text accessibilityRole="header" className="font-body text-[22px] leading-7 text-white">Mak&apos;s transfer was paused</Text>
    <Text className="font-body text-[17px] leading-6 text-white/90">Please call to check in. No amount or account details are shared.</Text>
    <Pressable accessibilityRole="button" disabled={calling} onPress={() => setCalling(true)}
      className="mt-1.5 h-[54px] flex-row items-center justify-center gap-2 rounded-full bg-[#1f9d63] active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
      <PhoneCallIcon size={20} color="#ffffff" weight="fill" />
      <Text className="font-body text-lg text-white">{calling ? 'Calling Mak (simulated)' : 'Call Mak'}</Text>
    </Pressable>
  </Glass>;
}

/**
 * The trusted contact's lock screen. It is a picture on this screen, driven by the same session:
 * nothing reaches another device, and the footer says so.
 */
export function FamilyScreen({ top, bottom }: { top: number; bottom: number }) {
  const { session, view } = useSession();
  const today = new Date();
  return <View className="flex-1">
    <Backdrop field="night" />
    <View className="items-center px-5" style={{ paddingTop: top + 36 }}>
      <Text className="font-body text-xl text-white/90">{days[today.getDay()]}, {today.getDate()} {months[today.getMonth()]}</Text>
      <Text aria-hidden className="font-display text-[104px] leading-[110px] tracking-[-2px] text-white">9:41</Text>
    </View>
    <View aria-live="polite" className="mt-7 px-3.5">
      {view.alert ? <Alert /> : <Glass tone="dark" radius={26} className="px-4 py-4">
        <Text className="text-center font-body text-[17px] leading-6 text-white/90">{session.family ? 'No alerts. Aina is Rohani’s trusted contact.' : 'No alerts. Rohani has not added a trusted contact.'}</Text>
      </Glass>}
    </View>
    <View className="flex-1" />
    <Text className="px-7 text-center font-body text-[15px] leading-[21px] text-white/90" style={{ paddingBottom: bottom + 16 }}>Simulated preview on this screen. Nothing is sent to another device.</Text>
  </View>;
}
