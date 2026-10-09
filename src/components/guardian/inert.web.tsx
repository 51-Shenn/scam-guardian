import type { ReactNode } from 'react';

/** Shows its children as a picture: the inert attribute removes them from pointer, keyboard and assistive technology. */
export function Inert({ children }: { children: ReactNode }) {
  return <div inert aria-hidden="true" style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>;
}
