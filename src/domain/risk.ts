export type Scenario = 'normal' | 'struggling' | 'coached' | 'medium';
export interface Signals {
  callActive: boolean;
  newRecipient: boolean;
  pasted: boolean;
  amountRatio: number;
  backPresses: number;
  helpTaps: number;
}
export interface Decision {
  classification: 'Normal' | 'Struggling' | 'Coached';
  response: 'continue' | 'guide' | 'cooldown' | 'hold';
  reasons: string[];
}

// Demonstration rules only. No trained model or calibrated probabilities.
export function evaluate(signals: Signals): Decision {
  if (signals.callActive && signals.newRecipient && (signals.pasted || signals.amountRatio > 3)) {
    return { classification: 'Coached', response: 'hold', reasons: [
      'Call signal is active', 'This is a new recipient',
      signals.pasted ? 'Account paste flag is present' : 'Amount exceeds 3x the usual transfer',
    ] };
  }
  if (signals.callActive && signals.newRecipient) {
    return { classification: 'Coached', response: 'cooldown', reasons: ['Call signal is active', 'This is a new recipient'] };
  }
  if (signals.backPresses >= 3 || signals.helpTaps >= 2) {
    return { classification: 'Struggling', response: 'guide', reasons: ['Extra navigation or help requests', 'Step-by-step guidance may help'] };
  }
  return { classification: 'Normal', response: 'continue', reasons: ['No demonstration rule requires an intervention'] };
}

export function validateAmount(text: string, balance: number): string | null {
  if (!/^\d+(\.\d{1,2})?$/.test(text.trim())) return 'Enter an amount with up to two decimal places.';
  const amount = Number(text);
  if (!Number.isFinite(amount) || amount <= 0) return 'Enter an amount greater than RM0.';
  if (amount > balance) return 'This amount exceeds the demo balance.';
  return null;
}

export function canConfirm(deadline: number | null, now: number): boolean {
  return deadline === null || now >= deadline;
}
