import { Pressable, Text } from 'react-native';

/** Save only measurements locally. Browser APIs stay in this web-specific component. */
export function MetricsExport({ json }: { json: string }) {
  const save = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scam-guardian-warning-metrics.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <Pressable accessibilityRole="button" onPress={save} className="min-h-11 justify-center rounded-xl bg-white px-3">
    <Text className="font-body text-sm text-ink">Download metrics JSON</Text>
  </Pressable>;
}
