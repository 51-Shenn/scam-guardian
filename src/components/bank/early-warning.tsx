import { Text, View } from 'react-native';
import { useSession } from './session';
import { DEMO_REQUESTS, requestFeatures } from '@/domain/request';

/** Mounted in the fixed footer, so a warning is visible before Review without requiring a scroll. */
export function EarlyWarning() {
  const { session, view, canShowWarning, markWarningDisplayed } = useSession();
  if (!view.origin || !canShowWarning || session.sheet) return null;
  const cues = session.requestShown && session.demoRequest ? requestFeatures(DEMO_REQUESTS[session.demoRequest]) : null;
  const bypass = cues?.warning_bypass === 1 && cues.avoid_verification === 1;
  return <View onLayout={markWarningDisplayed} accessibilityRole="alert" aria-live="polite"
    className="rounded-2xl bg-b-amber-bg px-3.5 py-2.5">
    <Text className="font-body text-[15px] leading-5 text-[#4f2b00]">{bypass ? 'This request tells you to ignore warnings and avoid a trusted check. Verify before sending.' : 'Before you send, check through a contact you already trust.'}</Text>
    <Text className="mt-1 font-body text-xs leading-4 text-[#4f2b00]">This is a review request, not proof of a scam.</Text>
  </View>;
}
