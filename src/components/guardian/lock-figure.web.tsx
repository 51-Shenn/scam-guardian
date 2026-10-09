import { useEffect, useRef } from 'react';

/** Appended to the caption only where the figure answers a pointer. */
export const LOCK_HINT = ' Move your pointer across the gates.';

// The Hairline page is a bench: the drawing, plus a slider, two buttons and notes for whoever tunes it.
// It is served unchanged from public/, so the bench is hidden from here; the page is on the same origin.
// The drawing stays at the top of the page, where the .lock-figure rule in global.css crops it to its plate.
const DRAWING_ONLY = 'html,body{overflow:hidden}body{place-items:start center}.controls,.tag,#means,#rules{display:none}';

export function LockFigure() {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const strip = () => {
      const page = el.contentDocument;
      if (!page?.getElementById('stage') || page.getElementById('drawing-only')) return;
      const style = page.createElement('style');
      style.id = 'drawing-only';
      style.textContent = DRAWING_ONLY;
      page.head.append(style);
    };
    strip(); // the page may have loaded before this ran
    el.addEventListener('load', strip);
    return () => el.removeEventListener('load', strip);
  }, []);
  // scrolling="no" keeps the bench out of reach until the style above lands.
  return <div className="lock-figure">
    <iframe ref={frame} src="/hairline-locks.html?theme=light" title="Interactive line drawing of three canal locks" loading="lazy" scrolling="no" />
  </div>;
}
