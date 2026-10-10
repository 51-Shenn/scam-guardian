/** Android reports focus through AppState, so there is no separate window focus signal. */
export function useWindowFocus(_onChange: (focused: boolean) => void) {}
