export const designs = {
  fluid: { name: 'Fluid Guardian', accent: '#244EBC', background: '#F4F7FC', summary: 'Flowing blue forms, soft surfaces, technical detail. The recommended balance of trust and motion.' },
  grid: { name: 'Signal Grid', accent: '#0F6562', background: '#F0F7F5', summary: 'A precise green signal field and structured layout. The strongest technical direction.' },
  ledger: { name: 'Human Ledger', accent: '#72503B', background: '#F9F6F2', summary: 'Hedvig-led typography, generous space and a restrained line illustration. The most human direction.' },
} as const;
export type Design = keyof typeof designs;
export function resolveDesign(value: unknown): Design {
  return value === 'grid' || value === 'ledger' ? value : 'fluid';
}
