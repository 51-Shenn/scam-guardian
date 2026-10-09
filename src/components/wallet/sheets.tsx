import { Text, View } from 'react-native';
import { WalletButton } from './button';
import { ClipboardIcon, HandPalmIcon, MicrophoneSlashIcon, type Icon } from './icons';
import { W } from './palette';
import { useSession } from './session';
import { Sheet } from './sheet';
import { Toggle } from './toggle';

const promises: [Icon, string][] = [
  [MicrophoneSlashIcon, 'No call audio and no caller identity.'],
  [ClipboardIcon, 'No clipboard contents. Only whether something was pasted.'],
  [HandPalmIcon, 'It can pause a transfer. It never blocks your decision.'],
];
const title = 'font-body text-[26px] leading-[30px] text-w-ink';
const body = 'font-body text-base leading-[22px] text-w-muted';

/** Guardian consent, with the separate trusted-contact consent beneath it. */
export function ConsentSheet({ bottom }: { bottom: number }) {
  const { session, dispatch } = useSession();
  return <Sheet label="Guardian consent" bottom={bottom} onDismiss={() => dispatch({ type: 'closeSheet' })}>
    <Text accessibilityRole="header" className={title}>Turn on Guardian for transfers?</Text>
    <Text className={body}>It watches one transfer at a time, from choosing a recipient until you confirm or cancel.</Text>
    <View className="gap-2.5">
      {promises.map(([Glyph, text]) => <View key={text} className="flex-row gap-2.5">
        <Glyph size={20} color={W.blue} /><Text className="flex-1 font-body text-[15px] leading-5 text-w-ink">{text}</Text>
      </View>)}
    </View>
    <View className="flex-row items-center gap-3 rounded-2xl bg-w-surface px-3.5 py-3">
      <Toggle checked={session.family} onChange={() => dispatch({ type: 'toggleFamily' })} label="Let Aina be asked to call me if a transfer is paused" />
      <Text className="flex-1 font-body text-[15px] leading-5 text-w-ink">Let Aina be asked to call me if a transfer is paused. No amount or account details are shared.</Text>
    </View>
    <WalletButton label="Agree and turn on" onPress={() => dispatch({ type: 'agree' })} />
    <WalletButton variant="quiet" label={session.consent ? 'Turn Guardian off' : 'Not now'} onPress={() => dispatch({ type: 'decline' })} />
  </Sheet>;
}

/** Shown once when a coached transfer reaches review. It asks; it does not accuse. */
export function PauseSheet({ bottom }: { bottom: number }) {
  const { view, dispatch } = useSession();
  return <Sheet label="Take a moment" bottom={bottom}>
    <Text accessibilityRole="header" className={title}>Is someone on the phone telling you to do this?</Text>
    <Text className={body}>Take time to check with someone you trust. You can cancel now, or decide to continue after the pause.</Text>
    {view.alert && <View className="gap-1 rounded-2xl bg-w-tint px-4 py-3.5">
      <Text className="font-body text-[15px] leading-5 text-w-deep">Alert preview for Aina: “A transfer was paused. Please call your family member to check in.”</Text>
      <Text className="font-body text-[13px] text-w-deep">Preview only. Nothing was sent to another device.</Text>
    </View>}
    <WalletButton label="Cancel this transfer" onPress={() => dispatch({ type: 'cancel' })} />
    <WalletButton variant="line" label="I want to review it myself" onPress={() => dispatch({ type: 'closeSheet' })} />
  </Sheet>;
}
