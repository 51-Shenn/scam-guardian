import { useEffect, useRef } from 'react';

/** Appended to the caption only where the figure answers a pointer. */
export const LOCK_HINT = ' Move your pointer across the gates.';

// The Hairline page is a bench: the drawing, plus a slider, two buttons and notes for whoever tunes it.
// It is served unchanged from public/, so the bench is hidden from here; the page is on the same origin.
// The drawing stays at the top of the page, where the .lock-figure rule in global.css crops it to its plate.
const DRAWING_ONLY = 'html,body{overflow:hidden}body{place-items:start center}.controls,.tag,#means,#rules{display:none}';

// The figure's own tour stops, in its 400 x 320 drawing units: the upper, middle and lower chambers, then rest.
const STOPS: ([number, number] | null)[] = [[243, 130], [201, 169], [147, 207], null];
// The page's built-in tour (?play=1) takes about eight seconds a lap and its pace is fixed inside the engine.
// This one walks the same stops from outside, through the pointer events the figure already answers, in about four.
// The gates take 700 ms to swing, and the far chamber starts 90 ms late. A step waits for all of that and a short rest,
// so each movement settles before the next begins; stepping any sooner makes the figure twitch without a pause.
const STEP = 1000;
const REST = 1000;

export function LockFigure() {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const el = frame.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    let timer = 0, next = 0, seen = false, hand = false;
    let armed: HTMLElement | null = null;

    const send = (type: 'pointermove' | 'pointerleave', at?: [number, number]) => {
      if (!armed) return;
      const r = armed.getBoundingClientRect();
      armed.dispatchEvent(new PointerEvent(type, {
        pointerType: 'mouse', pointerId: 1, bubbles: true,
        clientX: at ? r.left + (at[0] / 400) * r.width : 0, clientY: at ? r.top + (at[1] / 320) * r.height : 0,
      }));
    };
    const step = () => {
      const stop = STOPS[next];
      next = (next + 1) % STOPS.length;
      if (stop) send('pointermove', stop); else send('pointerleave');
      timer = window.setTimeout(step, stop ? STEP : REST);
    };
    // Plays only while the figure is on screen in a visible tab, nobody is pointing at it, and motion is welcome.
    const sync = () => {
      window.clearTimeout(timer);
      timer = 0;
      if (!armed || hand) return;
      if (seen && !document.hidden && !still.matches) { next = 0; timer = window.setTimeout(step, REST); }
      else send('pointerleave');
    };
    // A real pointer takes the figure over; the tour picks up again once it has left.
    const own = (event: Event) => {
      if (!event.isTrusted) return;
      hand = event.type !== 'pointerleave';
      sync();
    };
    const load = () => {
      const page = el.contentDocument;
      const stage = page?.getElementById('stage');
      if (!page || !stage) return;
      if (!page.getElementById('drawing-only')) {
        const style = page.createElement('style');
        style.id = 'drawing-only';
        style.textContent = DRAWING_ONLY;
        page.head.append(style);
      }
      if (armed === stage) return;
      armed = stage;
      for (const type of ['pointermove', 'pointerdown', 'pointerleave']) stage.addEventListener(type, own);
      sync();
    };

    const watcher = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; sync(); });
    watcher.observe(box);
    document.addEventListener('visibilitychange', sync);
    still.addEventListener('change', sync);
    el.addEventListener('load', load);
    load(); // the page may have loaded before this ran
    return () => {
      window.clearTimeout(timer);
      watcher.disconnect();
      document.removeEventListener('visibilitychange', sync);
      still.removeEventListener('change', sync);
      el.removeEventListener('load', load);
      if (armed) for (const type of ['pointermove', 'pointerdown', 'pointerleave']) armed.removeEventListener(type, own);
    };
  }, []);
  // scrolling="no" keeps the bench out of reach until the style above lands.
  return <div className="lock-figure">
    <iframe ref={frame} src="/hairline-locks.html?theme=light" title="Interactive line drawing of three canal locks" loading="lazy" scrolling="no" />
  </div>;
}
