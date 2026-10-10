export interface Viewport { width: number; height: number }

/** From this width up, the bank app runs inside the phone frame and stays interactive. */
export const WIDE = 860;
/** Outer size of the phone frame at scale 1. The screen inside is 440 x 956. */
export const FRAME = { width: 468, height: 984, statusBar: 58, homeIndicator: 26 } as const;
