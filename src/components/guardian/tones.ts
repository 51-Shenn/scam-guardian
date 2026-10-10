import type { Decision } from '@/domain/risk';

export type Tone = Decision['classification'];

// Class colours are data, not brand: red would read as an accusation, and Struggling calls for help instead.
// Three deep, quiet tones that sit with the garnet of the page: pine, indigo and bronze. Each has a fill, a text shade and a pale wash.
export const fill: Record<Tone, string> = { Normal: 'bg-[#1f6b57]', Struggling: 'bg-[#414f8f]', Coached: 'bg-[#a3661c]' };
export const ink: Record<Tone, string> = { Normal: 'text-[#17574a]', Struggling: 'text-[#36427a]', Coached: 'text-[#7c4a0c]' };
export const wash: Record<Tone, string> = { Normal: 'bg-[#dde9e4]', Struggling: 'bg-[#e2e5f1]', Coached: 'bg-[#f0e5d3]' };
/** An empty track or an unlit mark. */
export const idle = 'bg-[#e9dfe2]';
