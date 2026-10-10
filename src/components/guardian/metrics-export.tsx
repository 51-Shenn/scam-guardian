import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Pressable, Text } from 'react-native';

/** Explicit output copy only; never reads the clipboard. Android equivalent of the web JSON download. */
export function MetricsExport({ json }: { json: string }) {
  const [status, setStatus] = useState('Copy metrics JSON');
  return <Pressable accessibilityRole="button" className="min-h-11 justify-center rounded-xl bg-white px-3"
    onPress={() => { Clipboard.setStringAsync(json).then(() => setStatus('Copied metrics JSON')).catch(() => setStatus('Copy failed; retry')); }}>
    <Text className="font-body text-sm text-ink">{status}</Text>
  </Pressable>;
}
