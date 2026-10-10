import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Glass } from '@/components/glass/glass';
import { ACCOUNT_MAX_DIGITS, ACCOUNT_MIN_DIGITS } from '@/domain/session';
import { BankButton } from './button';
import { ClipboardTextIcon } from './icons';
import { B } from './palette';
import { useSession } from './session';
import { Tag } from './step-chrome';
import { useFieldSignals } from './use-field-signals';

/**
 * The new recipient's account number. The number stays in this field; Guardian records only that the
 * field changed, by how many characters, and whether a paste caused it.
 */
export function AccountField({ large }: { large: boolean }) {
  const { session, dispatch, guardian } = useSession();
  const { attach, onPressIn, takePaste, takeTouch } = useFieldSignals();
  const [pasteError, setPasteError] = useState(false);
  const short = session.account.length > 0 && session.account.length < ACCOUNT_MIN_DIGITS;

  const paste = async () => {
    setPasteError(false);
    const text = await Clipboard.getStringAsync().catch(() => '');
    const digits = text.replace(/\D/g, '');
    if (!digits) { setPasteError(true); return; }
    dispatch({ type: 'account', value: digits, pasted: true });
  };

  return <Glass radius={22} className="gap-2.5 p-4">
    <View className="flex-row items-center justify-between gap-2">
      <Text nativeID="account-label" className="font-body text-sm text-b-muted">Account number</Text>
      {session.entry === 'pasted' && <Tag label="Pasted" icon={<ClipboardTextIcon size={14} color={B.amber} />} />}
    </View>
    <View className="flex-row items-center gap-2.5">
      <TextInput
        ref={attach as never}
        aria-labelledby="account-label"
        accessibilityLabel="Account number"
        value={session.account}
        onChangeText={(value) => dispatch({ type: 'account', value, pasted: takePaste() })}
        onPressIn={onPressIn}
        onFocus={() => guardian.focus('recipient', takeTouch())}
        onBlur={() => guardian.blur('recipient')}
        inputMode="numeric"
        keyboardType="number-pad"
        autoComplete="off"
        maxLength={ACCOUNT_MAX_DIGITS}
        placeholder={`${ACCOUNT_MIN_DIGITS} to ${ACCOUNT_MAX_DIGITS} digits`}
        placeholderTextColor={B.muted}
        className={`h-14 min-w-0 flex-1 rounded-2xl bg-b-surface px-4 font-body text-b-ink ${large ? 'text-[22px]' : 'text-[19px]'}`}
        // Width 0 with flex 1: a browser input otherwise keeps its default width and pushes the Paste button out.
        style={{ fontVariant: ['tabular-nums'], letterSpacing: 0.4, width: 0 }}
      />
      <BankButton variant="line" label="Paste" icon={<ClipboardTextIcon size={18} color={B.ink} />} onPress={paste} />
    </View>
    <Text aria-live="polite" className={`font-body text-[13px] leading-[18px] ${short || pasteError ? 'text-[#a1260d]' : 'text-b-muted'}`}>
      {pasteError ? 'Nothing to paste. Copy an account number first.'
        : short ? `Enter at least ${ACCOUNT_MIN_DIGITS} digits.`
          : 'Use a made-up number. Guardian keeps only whether it was pasted, never the number.'}
    </Text>
  </Glass>;
}
