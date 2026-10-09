/** Appended to the caption only where the figure answers a pointer. */
export const LOCK_HINT = ' Move your pointer across the gates.';

// The Hairline page is served unchanged from public/. The .lock-figure rule in global.css crops it to its plate.
export function LockFigure() {
  return <div className="lock-figure">
    <iframe src="/hairline-locks.html?theme=light" title="Interactive line drawing of three canal locks" loading="lazy" />
  </div>;
}
