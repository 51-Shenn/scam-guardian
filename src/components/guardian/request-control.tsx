import { Pressable, Text, View } from 'react-native';
import { useSession } from '@/components/bank/session';
import { DEMO_REQUESTS, type DemoRequestId } from '@/domain/request';

export function RequestControl() {
  const { session, dispatch, measurement } = useSession();
  const selected = session.demoRequest;
  const deliverable = measurement !== null && selected !== null && !session.requestShown;
  const choices: (DemoRequestId | null)[] = [null, 'routine', 'coached', 'quiet'];
  return <View className="gap-2 rounded-xl bg-white/70 p-3">
    <Text className="font-body text-[15px] text-ink">Authored request · simulated</Text>
    <Text className="font-body text-xs leading-4 text-soft">Choose before Transfer, then deliver during the payment. Only numeric cues reach the model; no messages are read from another app.</Text>
    <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-1.5">
      {choices.map((id) => <Pressable key={id ?? 'none'} accessibilityRole="radio" accessibilityLabel={`Authored request ${id ?? 'none'}`}
        accessibilityState={{ checked: id === selected, disabled: session.step !== 'home' }} disabled={session.step !== 'home'}
        onPress={() => dispatch({ type: 'selectRequest', request: id })} className={`min-h-11 justify-center rounded-xl px-2.5 ${id === selected ? 'bg-ink' : 'bg-white'}`}>
        <Text className={`font-body text-xs ${id === selected ? 'text-white' : 'text-ink'}`}>{id ? DEMO_REQUESTS[id].label : 'Unavailable'}</Text>
      </Pressable>)}
    </View>
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !deliverable }} disabled={!deliverable}
      onPress={() => dispatch({ type: 'revealRequest' })} className={`min-h-11 justify-center rounded-xl px-3 ${deliverable ? 'bg-ink' : 'bg-white opacity-50'}`}>
      <Text className={`font-body text-sm ${deliverable ? 'text-white' : 'text-ink'}`}>{session.requestShown ? 'Authored request delivered' : 'Deliver authored request'}</Text>
    </Pressable>
    <Text className="font-body text-xs leading-4 text-soft">{session.requestShown ? 'Delivered. The next scored five-second prefix can use these request cues.'
      : selected === null ? 'No request selected. Choose an example before starting a transfer.'
      : measurement === null ? 'Start a transfer with Guardian on to enable delivery.'
      : 'Selected, not delivered. Press the dark button above to send the mock request to this transfer.'}</Text>
  </View>;
}
