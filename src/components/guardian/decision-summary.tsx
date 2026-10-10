import { Text, View } from 'react-native';
import { useSession } from '@/components/bank/session';
import { decisionSupport } from '@/domain/decision-support';
import { body, caption } from './text';

/** The display policy's category and priority for this transfer. Policy outputs, apart from the trained review. */
export function DecisionSummary() {
  const { session, view } = useSession();
  const support = decisionSupport(session, view);
  return <View className="flex-row gap-3">
    <View className="flex-1">
      <Text className={caption}>Policy category</Text>
      <Text className={`${body} text-ink`}>{support.category}</Text>
    </View>
    <View className="flex-1">
      <Text className={caption}>Policy priority</Text>
      <Text className={`${body} text-ink`}>{support.priority}</Text>
    </View>
  </View>;
}
