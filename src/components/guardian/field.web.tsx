import { useId } from 'react';
import type { FieldProps } from './field.types';
export function Field({ label, initialValue, onChange, numeric, large }: FieldProps) {
  const id = useId();
  return <label htmlFor={id} className="flex flex-col gap-3 font-body text-lg text-slate-900">{label}
    <input id={id} type="text" defaultValue={initialValue} inputMode={numeric ? 'decimal' : 'text'}
      onChange={(event) => onChange(event.target.value)} autoComplete="off"
      className={`${large ? 'min-h-18 text-3xl' : 'min-h-15 text-2xl'} rounded-xl border border-slate-500 bg-white px-4 focus:outline-2 focus:outline-offset-2 focus:outline-blue-700`} />
  </label>;
}
