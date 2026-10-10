import { Text, View } from 'react-native';
import { ChatCircleTextIcon, FlaskIcon, PaperPlaneTiltIcon } from '@/components/bank/icons';
import { useSession } from '@/components/bank/session';
import { DEMO_REQUESTS, type DemoRequestId } from '@/domain/request';
import { Button, Label, Segmented } from './controls';
import { body } from './text';

const choices: (DemoRequestId | null)[] = [null, 'routine', 'coached', 'quiet'];
const short: Record<DemoRequestId, string> = { routine: 'Routine', coached: 'Coached', quiet: 'Quiet' };

/** The authored request: chosen at home, then delivered during the payment. Each step shows only the control that works in it. Only the request's numeric cues reach the model. */
export function RequestControl({ dense }: { dense?: boolean }) {
  const { session, dispatch, measurement } = useSession();
  const selected = session.demoRequest;
  const home = session.step === 'home';
  const deliverable = measurement !== null && selected !== null && !session.requestShown;
  const status = session.requestShown ? 'Delivered to this transfer'
    : selected === null ? (home ? 'Choose before Transfer' : 'None selected')
    : home ? 'Deliver it during the transfer'
    : measurement === null ? 'Needs Guardian on' : 'Selected, not delivered yet';
  return <View className="gap-2">
    <Label icon={ChatCircleTextIcon} note={status}>Authored request, simulated</Label>
    {home ? <Segmented dense={dense} value={selected} onChange={(request) => dispatch({ type: 'selectRequest', request })}
      options={choices.map((id) => ({ value: id, label: id ? short[id] : 'None', accessibilityLabel: `Authored request ${id ?? 'none'}` }))} />
      : selected && <View className="flex-row flex-wrap items-center gap-2">
        <Text className={`min-w-[150px] flex-1 ${body} text-ink`}>{DEMO_REQUESTS[selected].label}</Text>
        <View><Button dense={dense} primary icon={PaperPlaneTiltIcon} label={session.requestShown ? 'Delivered' : 'Deliver'} disabled={!deliverable}
          accessibilityLabel={session.requestShown ? 'Authored request delivered' : 'Deliver authored request'} onPress={() => dispatch({ type: 'revealRequest' })} /></View>
      </View>}
  </View>;
}

/** One press sets up manual test MT02: the Normal preset, the coached request and a Coached-high label. It configures inputs; the model still decides. */
export function PrepareAiCase({ dense }: { dense?: boolean }) {
  const { dispatch, annotate } = useSession();
  return <Button dense={dense} icon={FlaskIcon} label="Prepare MT02 · AI warning test"
    onPress={() => {
      dispatch({ type: 'scenario', scenario: 'normal' });
      annotate('Coached-high');
      dispatch({ type: 'selectRequest', request: 'coached' });
    }} />;
}
