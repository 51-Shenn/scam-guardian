import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { CopyIcon } from '@/components/bank/icons';
import { Button } from './controls';

/** Explicit output copy only; never reads the clipboard. Android equivalent of the web JSON download. */
export function MetricsExport({ json, dense }: { json: string; dense?: boolean }) {
  const [status, setStatus] = useState('Copy metrics JSON');
  return <Button dense={dense} icon={CopyIcon} label={status}
    onPress={() => { Clipboard.setStringAsync(json).then(() => setStatus('Copied metrics JSON')).catch(() => setStatus('Copy failed; retry')); }} />;
}
