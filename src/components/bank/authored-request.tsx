import { Text, View } from 'react-native';
import { DEMO_REQUESTS } from '@/domain/request';
import { useSession } from './session';

/** Only fixed authored demo text; no messages are read from another app. */
export function AuthoredRequest() {
  const { session } = useSession();
  if (!session.requestShown || !session.demoRequest) return null;
  return <View className="gap-1 rounded-2xl bg-white/80 px-4 py-3">
    <Text className="font-body text-xs text-b-muted">Authored payment request · simulated</Text>
    <Text className="font-body text-[15px] leading-5 text-b-ink">{DEMO_REQUESTS[session.demoRequest].text}</Text>
    <Text className="font-body text-xs leading-4 text-b-muted">Mock request evidence. This does not verify the recipient you typed.</Text>
  </View>;
}
