import { Text, View } from 'react-native';
import { AI_REVIEW_REASON } from '@/domain/session';
import { BankButton } from './button';
import { ClipboardIcon, HandPalmIcon, MicrophoneSlashIcon, ShieldCheckIcon, type Icon } from './icons';
import { B } from './palette';
import { useSession } from './session';
import { Sheet } from './sheet';
import { Toggle } from './toggle';

const promises: [Icon, string][] = [
  [MicrophoneSlashIcon, 'No call audio and no caller identity.'],
  [ClipboardIcon, 'No clipboard contents. Only whether something was pasted.'],
  [HandPalmIcon, 'It can pause a transfer. It never blocks your decision.'],
];
const title = 'font-body text-[26px] leading-[30px] text-b-ink';
const body = 'font-body text-base leading-[22px] text-b-muted';

/** Guardian consent, with the separate trusted-contact consent beneath it. */
export function ConsentSheet({ bottom }: { bottom: number }) {
  const { session, dispatch } = useSession();
  return <Sheet label="Guardian consent" bottom={bottom} onDismiss={() => dispatch({ type: 'closeSheet' })}>
    <View aria-hidden className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-b-tint"><ShieldCheckIcon size={30} color={B.red} weight="fill" /></View>
    <Text accessibilityRole="header" className={title}>Turn on Guardian for transfers?</Text>
    <Text className={body}>It watches one transfer at a time, from choosing a recipient until you confirm or cancel.</Text>
    <View className="gap-2.5">
      {promises.map(([Glyph, text]) => <View key={text} className="flex-row gap-2.5">
        <Glyph size={20} color={B.red} /><Text className="flex-1 font-body text-[15px] leading-5 text-b-ink">{text}</Text>
      </View>)}
    </View>
    <View className="flex-row items-center gap-3 rounded-[20px] bg-b-tint px-3.5 py-3">
      <Toggle checked={session.family} onChange={() => dispatch({ type: 'toggleFamily' })} label="Let Aina be asked to call me if a transfer is paused" />
      <Text className="flex-1 font-body text-[15px] leading-5 text-b-ink">Let Aina be asked to call me if a transfer is paused. No amount or account details are shared.</Text>
    </View>
    <BankButton label="Agree and turn on" onPress={() => dispatch({ type: 'agree' })} />
    <BankButton variant="quiet" label={session.consent ? 'Turn Guardian off' : 'Not now'} onPress={() => dispatch({ type: 'decline' })} />
  </Sheet>;
}

/** Shown once when a coached transfer reaches review. It asks; it does not accuse. */
export function PauseSheet({ bottom }: { bottom: number }) {
  const { view, dispatch, guardian, canShowWarning, markWarningDisplayed } = useSession();
  const ai = view.origin === 'ai' || view.origin === 'combined';
  const choose = (action: 'cancel' | 'open_check') => {
    guardian.verify(action);
    dispatch({ type: action === 'cancel' ? 'cancel' : 'closeSheet' });
  };
  return <Sheet label="Take a moment" bottom={bottom}>
    <Text key={String(canShowWarning)} onLayout={markWarningDisplayed} accessibilityRole="header" className={title}>{view.origin === 'ai' ? 'Pause and verify this payment' : 'Is someone on the phone telling you to do this?'}</Text>
    <Text className={body}>{ai ? `${AI_REVIEW_REASON}. ` : ''}Take time to check with someone you trust. You can cancel now, or decide to continue after the pause.</Text>
    {view.alert && <View className="gap-1 rounded-[20px] bg-b-tint px-4 py-3.5">
      <Text className="font-body text-[15px] leading-5 text-[#6d0a1b]">Aina would be asked to call you now. The request carries no amount and no account details.</Text>
      <Text className="font-body text-[13px] text-[#6d0a1b]">Preview only. Nothing was sent to another device.</Text>
    </View>}
    <BankButton label="Cancel this transfer" onPress={() => choose('cancel')} />
    <BankButton variant="line" label="I want to review it myself" onPress={() => choose('open_check')} />
  </Sheet>;
}
