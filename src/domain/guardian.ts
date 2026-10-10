import { Collector, type Field } from './collector.ts';
import { createRecorder, type RecorderOptions } from './recorder.ts';
import type { Action, Session } from './session.ts';

/** Joins the collector and the recorder. The UI calls this; it holds no React and no platform code. */
export function createGuardian(options: RecorderOptions) {
  const collector = new Collector();
  const recorder = createRecorder(options);
  return {
    get sessionId() { return recorder.sessionId; },
    observe(action: Action, prev: Session, next: Session): void {
      const collected = collector.observe(action, prev, next);
      if (collected.start) recorder.start();
      recorder.record(collected.drafts);
      if (collected.end) recorder.end(collected.end);
    },
    focus(field: Field, fromTouch: boolean): void { recorder.record(collector.focus(field, fromTouch)); },
    blur(field: Field): void { recorder.record(collector.blur(field)); },
    lifecycle(state: 'active' | 'inactive' | 'background'): void { recorder.record(collector.lifecycle(state)); },
    windowFocus(focused: boolean): void { recorder.record(collector.windowFocus(focused)); },
    predictDue: recorder.predictDue,
    warn: recorder.warn,
    verify: recorder.verify,
    annotate: recorder.annotate,
    report: recorder.report,
    get measurement() { return recorder.measurement; },
  };
}

export type Guardian = ReturnType<typeof createGuardian>;
