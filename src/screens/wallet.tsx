import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Keyboard, ScrollView, Text, View } from 'react-native';
import { Action } from '@/components/guardian/action';
import { Field } from '@/components/guardian/field';
import { canConfirm, evaluate, validateAmount, type Scenario } from '@/domain/risk';

type Step = 'home' | 'recipient' | 'amount' | 'review' | 'success';
const scenarioLabels: Record<Scenario, string> = { normal: 'Normal', struggling: 'Struggling', medium: 'Coached / medium', coached: 'Coached / high' };
const initialAmounts: Record<Scenario, string> = { normal: '50', struggling: '50', medium: '100', coached: '1200' };
const money = (amount: number) => `RM ${amount.toFixed(2)}`;

export default function Wallet() {
  const [step, setStep] = useState<Step>('home');
  const [scenario, setScenario] = useState<Scenario>('normal');
  const [consent, setConsent] = useState(false);
  const [familyConsent, setFamilyConsent] = useState(false);
  const [balance, setBalance] = useState(2500);
  const [amount, setAmount] = useState('50');
  const [recipient, setRecipient] = useState('Aina / saved contact');
  const [newRecipient, setNewRecipient] = useState(false);
  const [helpTaps, setHelpTaps] = useState(0);
  const [backPresses, setBackPresses] = useState(0);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [alertPreview, setAlertPreview] = useState(false);
  const active = step !== 'home' && step !== 'success';
  const callActive = scenario === 'coached' || scenario === 'medium';
  const decision = consent && active ? evaluate({
    callActive, newRecipient, pasted: scenario === 'coached', amountRatio: Number(amount) / 50,
    backPresses: backPresses + (scenario === 'struggling' ? 3 : 0), helpTaps,
  }) : { classification: 'Normal', response: 'continue', reasons: ['Guardian is not monitoring this screen'] };
  const simple = decision.response === 'guide' || helpTaps > 0;
  const remaining = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0;
  const paused = deadline !== null || decision.response === 'hold' || decision.response === 'cooldown';
  useEffect(() => {
    if (step !== 'review' || deadline === null) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [step, deadline]);
  function start() {
    setAmount(initialAmounts[scenario]);
    setNewRecipient(callActive);
    setRecipient(callActive ? 'New recipient / demo account' : 'Aina / saved contact');
    setHelpTaps(0); setBackPresses(0); setDeadline(null); setAlertPreview(false); setError(null); setStep('recipient');
  }
  function cancel() { Keyboard.dismiss(); setStep('home'); setDeadline(null); setError(null); setAlertPreview(false); }
  function review() {
    Keyboard.dismiss();
    const invalid = validateAmount(amount, balance);
    setError(invalid);
    if (invalid) return;
    const timestamp = Date.now();
    if (paused && deadline === null) setDeadline(timestamp + 30000);
    setNow(timestamp); setAlertPreview(decision.response === 'hold' && familyConsent); setStep('review');
  }
  function confirm() {
    if (paused && (deadline === null || !canConfirm(deadline, Date.now()))) return;
    const invalid = validateAmount(amount, balance);
    if (invalid) { setError(invalid); setStep('amount'); return; }
    setBalance((current) => current - Number(amount)); setStep('success'); setDeadline(null);
  }
  return <ScrollView className="flex-1 bg-slate-50" keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic">
    <View className="mx-auto w-full max-w-6xl gap-7 px-6 py-8">
      <View className="flex-row flex-wrap items-center justify-between gap-4">
        <Text className="font-display text-2xl text-slate-900">Scam Guardian</Text>
        <Action large={simple && active} label="Product page" secondary onPress={() => router.push('/')} />
      </View>
      <Text className="font-body text-base leading-6 text-slate-600">Mock wallet. No real money moves. Call and paste signals below are simulated; family alerts stay on this screen.</Text>
      <View className="gap-8 lg:flex-row lg:items-start">
        <View className="gap-6 rounded-3xl border border-slate-200 bg-white p-6 lg:flex-1">
          <Text className="font-display text-4xl text-slate-900">{({ home: 'Your demo wallet', recipient: 'Who are you sending to?', amount: 'How much would you like to send?', review: paused ? 'Take a moment' : 'Check your transfer', success: 'Demo transfer complete' })[step]}</Text>
          {step === 'home' && <>
            <Text className="font-body text-lg text-slate-600">Demo balance</Text><Text className="font-body text-4xl text-slate-900">{money(balance)}</Text>
            <Text className="font-body text-lg leading-7 text-slate-700">Guardian uses transfer summaries, not call audio or clipboard contents. Monitoring starts when you choose a recipient and ends on confirm or cancel.</Text>
            <Action large={simple && active} label={consent ? 'Guardian enabled / turn off' : 'Agree and enable Guardian'} secondary onPress={() => { setConsent(!consent); if (consent) setFamilyConsent(false); }} />
            <Action large={simple && active} label={familyConsent ? 'Aina alerts allowed / revoke' : 'Allow alert previews for Aina'} secondary disabled={!consent} onPress={() => setFamilyConsent(!familyConsent)} />
            <Text className="font-body text-base leading-6 text-slate-600">Separate contact consent: a paused-transfer message asks Aina to call you, with no account details or amount. In this demo it is only a preview.</Text>
            <Action large={simple && active} label="Start a transfer" onPress={start} />
          </>}
          {step === 'recipient' && <>
            <Text className="font-body text-lg leading-7 text-slate-600">Choose a saved family contact or a new demonstration recipient.</Text>
            <Action large={simple && active} label="Aina / saved contact" secondary={newRecipient} onPress={() => { setRecipient('Aina / saved contact'); setNewRecipient(false); }} />
            <Action large={simple && active} label="New recipient / demo account" secondary={!newRecipient} onPress={() => { setRecipient('New recipient / demo account'); setNewRecipient(true); }} />
            <Action large={simple && active} label="Enter amount" onPress={() => setStep('amount')} />
          </>}
          {step === 'amount' && <>
            <Text className="font-body text-lg text-slate-700">To {recipient}</Text>
            <Field large={simple} label="Amount in RM" initialValue={amount} onChange={(value) => { setAmount(value); setError(null); }} numeric />
            <Text className="font-body text-base text-slate-600">Available: {money(balance)}</Text>
            {error && <Text accessibilityRole="alert" className="font-body text-lg text-red-800">{error}</Text>}
            <Action large={simple && active} label="Review transfer" onPress={review} />
          </>}
          {step === 'review' && <>
            <Text className="font-body text-3xl text-slate-900">{money(Number(amount))}</Text>
            <Text className="font-body text-lg text-slate-700">To {recipient}</Text>
            {paused && <View className="gap-4 rounded-2xl bg-amber-50 p-5">
              <Text className="font-body text-xl text-amber-950">Is someone on the phone telling you to do this?</Text>
              <Text className="font-body text-lg leading-7 text-amber-950">Take time to check with someone you trust. You can cancel now or decide to continue after the pause.</Text>
              <Text accessibilityLiveRegion="polite" className="font-body text-2xl text-amber-950">{remaining > 0 ? `Pause: ${remaining} seconds` : 'The pause has ended. The choice is yours.'}</Text>
            </View>}
            {alertPreview && <View className="gap-3 rounded-2xl bg-blue-50 p-5">
              <Text className="font-body text-lg text-blue-950">Local family-alert preview / Aina</Text>
              <Text className="font-body text-lg leading-7 text-blue-950">A transfer was paused. Please call your family member to check in.</Text>
              <Text className="font-body text-base text-blue-900">No notification has been sent to another device.</Text>
            </View>}
            <Action large={simple && active} label={paused ? 'Continue demo transfer' : 'Confirm demo transfer'} disabled={paused && remaining > 0} onPress={confirm} />
          </>}
          {simple && active && <View className="gap-3 rounded-2xl bg-blue-50 p-5">
            <Text className="font-body text-xl text-blue-950">Let us take it one step at a time.</Text>
            <Text className="font-body text-lg leading-7 text-blue-950">{step === 'recipient' ? 'Choose the person you want to send to, then select Enter amount.' : step === 'amount' ? 'Enter the amount in ringgit. Then select Review transfer.' : 'Check the person and amount above. Confirm only when both are right.'}</Text>
          </View>}
          {step === 'success' && <>
            <Text className="font-body text-xl leading-8 text-slate-700">Your mock balance is now {money(balance)}. This demonstration did not send real funds.</Text>
            <Action large={simple && active} label="Back to wallet" onPress={() => setStep('home')} />
          </>}
          {active && <>
            <Action large={simple && active} label="Help me with this step" secondary onPress={() => setHelpTaps((current) => current + 1)} />
            {step !== 'recipient' && <Action large={simple && active} label="Go back" secondary onPress={() => { setBackPresses((current) => current + 1); setStep(step === 'review' ? 'amount' : 'recipient'); setError(null); }} />}
            <Action large={simple && active} label="Cancel transfer" secondary onPress={cancel} />
          </>}
        </View>
        <View className="w-full gap-5 rounded-3xl border border-slate-200 p-6 lg:w-[330px]">
          <Text className="font-body text-xl text-slate-900">Demo controls</Text>
          <Text className="font-body text-base leading-6 text-slate-600">Pick a fixture before starting. These are deterministic rules, not trained-model probabilities.</Text>
          {(Object.keys(scenarioLabels) as Scenario[]).map((key) => <Action large={simple && active} key={key} label={scenarioLabels[key]} secondary={key !== scenario} disabled={active} onPress={() => { setScenario(key); setStep('home'); }} />)}
          <Text className="font-body text-base leading-6 text-slate-600">{callActive ? 'Fixture: call active, new recipient' : scenario === 'struggling' ? 'Fixture: repeated back navigation' : 'Fixture: saved contact, RM50'}</Text>
          <Text className="font-body text-xl text-slate-900">{active && consent ? decision.classification : 'Monitoring inactive'}</Text>
          {active && consent && decision.reasons.map((reason) => <Text key={reason} className="font-body text-base leading-6 text-slate-600">{reason}</Text>)}
        </View>
      </View>
    </View>
  </ScrollView>;
}
