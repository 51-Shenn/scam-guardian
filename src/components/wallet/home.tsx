import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { money } from '@/domain/session';
import {
  ArrowsLeftRightIcon, BellIcon, CarProfileIcon, ChartLineUpIcon, CreditCardIcon, DeviceMobileIcon, DotsNineIcon, EyeIcon, EyeSlashIcon,
  GiftIcon, HouseIcon, LetterCirclePIcon, PlusIcon, QrCodeIcon, ReceiptIcon, ScanIcon, ShieldCheckIcon, StorefrontIcon, UmbrellaIcon,
  UserIcon, WalletIcon, XIcon, type Icon,
} from './icons';
import { W } from './palette';
import { useSession } from './session';

const quick: [Icon, string][] = [[ScanIcon, 'Scan'], [QrCodeIcon, 'Pay'], [ArrowsLeftRightIcon, 'Transfer'], [CreditCardIcon, 'Cards']];
const services: [Icon, string][] = [
  [CarProfileIcon, 'Toll'], [LetterCirclePIcon, 'Parking'], [ReceiptIcon, 'Bills'], [DeviceMobileIcon, 'Prepaid'],
  [UmbrellaIcon, 'Insurance'], [ChartLineUpIcon, 'Invest'], [GiftIcon, 'Rewards'], [DotsNineIcon, 'More'],
];
const round = 'h-10 w-10 items-center justify-center rounded-full active:bg-white/15 focus-visible:outline-2 focus-visible:outline-[#ffb300]';
const tab = 'min-h-12 flex-1 items-center justify-center gap-[3px] rounded-xl';

interface HomeProps { top: number; bottom: number; onSoon: () => void; onExit?: () => void }

export function Home({ top, bottom, onSoon, onExit }: HomeProps) {
  const { session, view, dispatch } = useSession();
  return <View className="flex-1">
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="pb-4">
      <LinearGradient colors={['#2f7bea', W.blue, W.deep]} locations={[0, 0.4, 1]} start={{ x: 1, y: 0 }} end={{ x: 0.35, y: 1 }}
        style={{ paddingTop: top + 8, paddingHorizontal: 20, paddingBottom: 62 }}>
        <View className="flex-row items-center gap-3">
          <View aria-hidden className="h-[38px] w-[38px] items-center justify-center rounded-full bg-white"><Text className="font-body text-[17px] text-w-blue">R</Text></View>
          <View className="flex-1"><Text className="font-body text-[15px] text-white/90">Selamat datang</Text><Text className="font-body text-[17px] text-white">Rohani</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={onSoon} className={round}><BellIcon size={22} color="#ffffff" /></Pressable>
          {onExit && <Pressable accessibilityRole="button" accessibilityLabel="Close the wallet demo" onPress={onExit} className={round}><XIcon size={22} color="#ffffff" /></Pressable>}
        </View>
        <View className="mt-[22px] flex-row items-center gap-1.5">
          <Text className="font-body text-sm text-white/90">Demo balance</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={session.hidden ? 'Show balance' : 'Hide balance'} onPress={() => dispatch({ type: 'toggleHidden' })}
            className="h-8 w-8 items-center justify-center rounded-full active:bg-white/15 focus-visible:outline-2 focus-visible:outline-[#ffb300]">
            {session.hidden ? <EyeSlashIcon size={18} color="#ffffff" /> : <EyeIcon size={18} color="#ffffff" />}
          </Pressable>
        </View>
        <Text className="font-body text-[40px] leading-[46px] tracking-[-0.8px] text-white" style={{ fontVariant: ['tabular-nums'] }}>{session.hidden ? 'RM ••••' : money(session.balance)}</Text>
        <View className="mt-3.5 flex-row items-center justify-between">
          <Pressable accessibilityRole="button" onPress={onSoon} className="h-[38px] flex-row items-center gap-1.5 rounded-full bg-w-yellow px-4 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-white">
            <PlusIcon size={16} color="#1c2433" /><Text className="font-body text-[15px] text-[#1c2433]">Reload</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Guardian is ${session.consent ? 'on' : 'off'}. Change`} onPress={() => dispatch({ type: 'openConsent' })}
            className={`h-[38px] flex-row items-center gap-1.5 rounded-full px-4 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-[#ffb300] ${session.consent ? 'bg-white' : 'bg-white/15'}`}>
            <ShieldCheckIcon size={18} color={session.consent ? W.deep : '#ffffff'} weight={session.consent ? 'fill' : 'regular'} />
            <Text className={`font-body text-[15px] ${session.consent ? 'text-w-deep' : 'text-white'}`}>Guardian {session.consent ? 'on' : 'off'}</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View className="mx-4 -mt-11 flex-row rounded-[20px] bg-white px-1.5 py-3.5" style={{ boxShadow: '0 10px 28px -14px rgba(7, 63, 156, 0.35)' }}>
        {quick.map(([Glyph, label]) => <Pressable key={label} accessibilityRole="button" onPress={label === 'Transfer' ? () => dispatch({ type: 'transfer' }) : onSoon}
          className="flex-1 items-center gap-[7px] rounded-[14px] py-1.5 active:opacity-80 focus-visible:outline-2 focus-visible:outline-[#ffb300]">
          <View className="h-[50px] w-[50px] items-center justify-center rounded-2xl bg-w-blue"><Glyph size={26} color="#ffffff" /></View>
          <Text className="font-body text-[13px] text-w-ink">{label}</Text>
        </Pressable>)}
      </View>

      <View className="mx-4 mt-4 flex-row flex-wrap rounded-[20px] bg-white px-1.5 pb-2 pt-3.5">
        {services.map(([Glyph, label]) => <Pressable key={label} accessibilityRole="button" onPress={onSoon}
          className="w-1/4 items-center gap-[7px] rounded-[14px] py-2 active:opacity-80 focus-visible:outline-2 focus-visible:outline-[#ffb300]">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-w-tint"><Glyph size={23} color={W.blue} /></View>
          <Text className="font-body text-[13px] text-w-ink">{label}</Text>
        </Pressable>)}
      </View>

      <View className="m-4 flex-row gap-3 rounded-2xl bg-white px-4 py-3.5">
        <ShieldCheckIcon size={22} color={W.blue} />
        <View className="flex-1">
          <Text className="font-body text-[15px] text-w-ink">This is a demo wallet</Text>
          <Text className="font-body text-sm leading-5 text-w-muted">No real money moves. Scenario: {view.fixture.label.toLowerCase()}. Tap Transfer to begin.</Text>
        </View>
      </View>
    </ScrollView>

    <View className="flex-row items-end border-t border-w-line bg-white px-2 pt-2" style={{ paddingBottom: bottom + 2 }}>
      <View accessibilityRole="button" accessibilityState={{ selected: true }} className={tab}><HouseIcon size={24} color={W.blue} weight="fill" /><Text className="font-body text-xs text-w-blue">Home</Text></View>
      <Pressable accessibilityRole="button" onPress={onSoon} className={tab}><StorefrontIcon size={24} color={W.muted} /><Text className="font-body text-xs text-w-muted">Shop</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Scan" onPress={onSoon} className={tab}>
        <View className="-mt-[30px] h-[58px] w-[58px] items-center justify-center rounded-full border-4 border-white bg-w-blue"><ScanIcon size={28} color="#ffffff" /></View>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onSoon} className={tab}><WalletIcon size={24} color={W.muted} /><Text className="font-body text-xs text-w-muted">Finance</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={onSoon} className={tab}><UserIcon size={24} color={W.muted} /><Text className="font-body text-xs text-w-muted">Profile</Text></Pressable>
    </View>
  </View>;
}
