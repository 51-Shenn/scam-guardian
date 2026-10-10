import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Glass } from '@/components/glass/glass';
import { money } from '@/domain/session';
import { Backdrop } from './backdrop';
import {
  ArrowDownLeftIcon, ArrowsLeftRightIcon, ArrowUpRightIcon, BankIcon, BellIcon, ChartLineUpIcon, CreditCardIcon, DeviceMobileIcon, DotsNineIcon,
  EyeIcon, EyeSlashIcon, GiftIcon, HandCoinsIcon, HouseIcon, LightningIcon, QrCodeIcon, ReceiptIcon, ScanIcon, ShieldCheckIcon, UmbrellaIcon,
  UserIcon, VaultIcon, XIcon, type Icon,
} from './icons';
import { B } from './palette';
import { useSession } from './session';

const quick: [Icon, string][] = [[ArrowsLeftRightIcon, 'Transfer'], [ReceiptIcon, 'Pay bills'], [QrCodeIcon, 'Scan QR'], [DeviceMobileIcon, 'Top up']];
const services: [Icon, string][] = [
  [BankIcon, 'Accounts'], [CreditCardIcon, 'Cards'], [HandCoinsIcon, 'Loans'], [VaultIcon, 'Deposits'],
  [ChartLineUpIcon, 'Invest'], [UmbrellaIcon, 'Insurance'], [GiftIcon, 'Rewards'], [DotsNineIcon, 'More'],
];
// Made-up history. The RM 50 transfer matches the usual amount the demo rules compare against.
const activity: [Icon, string, string, string, boolean][] = [
  [ArrowUpRightIcon, 'Transfer to Aina', '2 Oct', '-RM 50.00', false],
  [ArrowDownLeftIcon, 'Pension credit', '1 Oct', '+RM 1,200.00', true],
  [LightningIcon, 'Electricity bill', '28 Sep', '-RM 86.40', false],
];
const onRed = 'active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
const onLight = 'active:opacity-70 focus-visible:outline-2 focus-visible:outline-accent';
const tab = `min-h-12 flex-1 items-center justify-center gap-[3px] rounded-2xl ${onLight}`;

interface HomeProps { top: number; bottom: number; onSoon: () => void; onExit?: () => void }

export function Home({ top, bottom, onSoon, onExit }: HomeProps) {
  const { session, dispatch } = useSession();
  return <View className="flex-1">
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottom + 96 }}>
      <View className="overflow-hidden rounded-b-[36px] px-5 pb-[68px]" style={{ paddingTop: top + 8 }}>
        <Backdrop field="hero" />
        <View className="flex-row items-center gap-3">
          <Glass tone="clear" radius={20} className="h-10 w-10 items-center justify-center"><Text aria-hidden className="font-body text-[17px] text-white">R</Text></Glass>
          <View className="flex-1"><Text className="font-body text-sm text-white/90">Selamat datang</Text><Text className="font-body text-[17px] text-white">Rohani</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={onSoon} className={`rounded-full ${onRed}`}>
            <Glass tone="clear" radius={20} className="h-10 w-10 items-center justify-center"><BellIcon size={21} color="#ffffff" /></Glass>
          </Pressable>
          {onExit && <Pressable accessibilityRole="button" accessibilityLabel="Close the banking demo" onPress={onExit} className={`rounded-full ${onRed}`}>
            <Glass tone="clear" radius={20} className="h-10 w-10 items-center justify-center"><XIcon size={21} color="#ffffff" /></Glass>
          </Pressable>}
        </View>

        <Glass tone="clear" radius={28} className="mt-5 px-5 pb-4 pt-[18px]">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="font-body text-[15px] text-white">Demo savings account</Text>
            <Text className="font-body text-[15px] text-white/90" style={{ fontVariant: ['tabular-nums'] }}>•••• 4471</Text>
          </View>
          <View className="mt-4 flex-row items-center gap-1">
            <Text className="font-body text-sm text-white/90">Available balance</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={session.hidden ? 'Show balance' : 'Hide balance'} onPress={() => dispatch({ type: 'toggleHidden' })}
              className={`h-8 w-8 items-center justify-center rounded-full ${onRed}`}>
              {session.hidden ? <EyeSlashIcon size={18} color="#ffffff" /> : <EyeIcon size={18} color="#ffffff" />}
            </Pressable>
          </View>
          <Text className="font-body text-[40px] leading-[46px] tracking-[-0.8px] text-white" style={{ fontVariant: ['tabular-nums'] }}>{session.hidden ? 'RM ••••' : money(session.balance)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Guardian is ${session.consent ? 'on' : 'off'}. Change`} onPress={() => dispatch({ type: 'openConsent' })}
            className={`mt-4 h-[38px] flex-row items-center gap-1.5 self-start rounded-full px-3.5 active:scale-[0.96] ${onRed} ${session.consent ? 'bg-white' : 'border border-white/50 bg-white/10'}`}>
            <ShieldCheckIcon size={18} color={session.consent ? B.red : '#ffffff'} weight={session.consent ? 'fill' : 'regular'} />
            <Text className={`font-body text-[15px] ${session.consent ? 'text-b-red' : 'text-white'}`}>Guardian {session.consent ? 'on' : 'off'}</Text>
          </Pressable>
        </Glass>
      </View>

      <Glass radius={26} className="mx-4 -mt-11 flex-row px-1.5 py-3.5">
        {quick.map(([Glyph, label], index) => <Pressable key={label} accessibilityRole="button" onPress={index ? onSoon : () => dispatch({ type: 'transfer' })}
          className={`flex-1 items-center gap-[7px] rounded-2xl py-1.5 ${onLight}`}>
          <View className={`h-[50px] w-[50px] items-center justify-center rounded-[18px] ${index ? 'bg-b-tint' : 'bg-b-red'}`}><Glyph size={26} color={index ? B.red : '#ffffff'} /></View>
          <Text className="font-body text-[13px] text-b-ink">{label}</Text>
        </Pressable>)}
      </Glass>

      <Glass radius={26} className="mx-4 mt-3.5 flex-row flex-wrap px-1.5 pb-2 pt-3.5">
        {services.map(([Glyph, label]) => <Pressable key={label} accessibilityRole="button" onPress={onSoon} className={`w-1/4 items-center gap-[7px] rounded-2xl py-2 ${onLight}`}>
          <Glyph size={26} color={B.ink} />
          <Text className="font-body text-[13px] text-b-ink">{label}</Text>
        </Pressable>)}
      </Glass>

      <Glass radius={26} className="mx-4 mt-3.5 px-4 pb-1.5 pt-3.5">
        <View className="flex-row items-baseline justify-between">
          <Text accessibilityRole="header" className="font-body text-[17px] text-b-ink">Recent activity</Text>
          <Text className="font-body text-[13px] text-b-muted">Demo data</Text>
        </View>
        {activity.map(([Glyph, label, date, amount, credit], index) => <View key={label} className={`flex-row items-center gap-3 py-3 ${index ? 'border-t border-b-line' : ''}`}>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-b-surface"><Glyph size={20} color={credit ? B.green : B.ink} /></View>
          <View className="flex-1"><Text className="font-body text-[15px] text-b-ink">{label}</Text><Text className="font-body text-[13px] text-b-muted">{date}</Text></View>
          <Text className={`font-body text-[15px] ${credit ? 'text-[#0c7046]' : 'text-b-ink'}`} style={{ fontVariant: ['tabular-nums'] }}>{amount}</Text>
        </View>)}
      </Glass>

      <Text className="mx-6 mt-4 font-body text-sm leading-5 text-b-muted">This is a demo bank account. No real money moves. Tap Transfer to begin.</Text>
    </ScrollView>

    {/* Content fades out beneath the floating bar instead of showing through the gap under it. */}
    <LinearGradient aria-hidden colors={['rgba(245, 245, 248, 0)', '#f5f5f8']} locations={[0, 0.55]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: bottom + 96, pointerEvents: 'none' }} />
    <Glass radius={34} className="h-[68px] flex-row items-center px-2" style={{ position: 'absolute', left: 12, right: 12, bottom: bottom + 4 }}>
      <View accessibilityRole="button" accessibilityState={{ selected: true }} className={tab}><HouseIcon size={24} color={B.red} weight="fill" /><Text className="font-body text-xs text-b-red">Home</Text></View>
      <Pressable accessibilityRole="button" onPress={onSoon} className={tab}><BankIcon size={24} color={B.muted} /><Text className="font-body text-xs text-b-muted">Accounts</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Scan" onPress={onSoon} className={`flex-1 items-center rounded-full ${onLight}`}>
        <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-b-red" style={{ boxShadow: '0 8px 16px -8px rgba(138, 11, 32, 0.8)' }}><ScanIcon size={26} color="#ffffff" /></View>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onSoon} className={tab}><CreditCardIcon size={24} color={B.muted} /><Text className="font-body text-xs text-b-muted">Cards</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={onSoon} className={tab}><UserIcon size={24} color={B.muted} /><Text className="font-body text-xs text-b-muted">Profile</Text></Pressable>
    </Glass>
  </View>;
}
