import { DownloadSimpleIcon } from '@/components/bank/icons';
import { Button } from './controls';

/** Save only measurements locally. Browser APIs stay in this web-specific component. */
export function MetricsExport({ json, dense }: { json: string; dense?: boolean }) {
  const save = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scam-guardian-warning-metrics.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <Button dense={dense} icon={DownloadSimpleIcon} label="Download metrics JSON" onPress={save} />;
}
