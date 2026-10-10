import { useEffect } from 'react';

/** Browser window focus. A tab can stay visible while another window has focus, so this is recorded separately. */
export function useWindowFocus(onChange: (focused: boolean) => void) {
  useEffect(() => {
    const focus = () => onChange(true);
    const blur = () => onChange(false);
    window.addEventListener('focus', focus);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('focus', focus);
      window.removeEventListener('blur', blur);
    };
  }, [onChange]);
}
